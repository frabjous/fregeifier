<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// libfregeify.php /////////////////////////////
// Common functions for image creation and discovery      //
////////////////////////////////////////////////////////////

// NOTE: should be loaded after navigating to correct directory

function clean_up() {
    foreach(glob('fregeifier_temporary_file*') as $file) {
        unlink($file);
    }
}

function fill_template($template, $vals) {
    $doc = $template;
    foreach($vals as $key => $v) {
        $doc = str_replace('% FREGEIFIER:' . $key, $v, $doc);
    }
    return $doc;
}

function get_image_file($mathtext, $displayinline) {
    global $record, $image_extension;
    // if already there, just return what we have
    if (isset($record->{$mathtext}->
                {$displayinline}->{$image_extension})) {
        if (file_exists($record->{$mathtext}
                    ->{$displayinline}->{$image_extension})) {
            return $record->{$mathtext}->
                {$displayinline}->{$image_extension};
        }
    }
    // image gets next number after counter
    $ctr=0;
    if (isset($record->counter)) {
        $ctr = $record->counter;
    }
    $ctr++;
    // create holder objects if need be
    $record->counter = $ctr;
    if (!isset($record->{$mathtext})) {
        $record->{$mathtext} = new StdClass();
    }
    if (!isset($record->{$mathtext}->{$displayinline})) {
        $record->{$mathtext}->{$displayinline} =
            new StdClass();
    }
    // create new image and record its filename
    $record->{$mathtext}->{$displayinline}->
        {$image_extension} = make_image(
        $mathtext, $displayinline, $ctr
    );
    save_record($record);
    if ($record->{$mathtext}->{$displayinline} == false) {
        return 'fregeify_error.png';
    }
    return $record->{$mathtext}->{$displayinline}->{$image_extension};
}

function get_record() {
    if (file_exists('images/fregeifier-record.json')) {
        $json = file_get_contents('images/fregeifier-record.json') ?? '';
        $rec = json_decode($json) ?? false;
        if (!$rec) { return new StdClass(); }
        return $rec;
    }
    return new StdClass();
}

function get_template() {
    $env_location = getenv('FREGEIFIER_TEMPLATE') ?? '';
    if (($env_location != '') && file_exists($env_location)) {
        return file_get_contents($env_location);
    }
    if (file_exists('./fregeifier-template.tex')) {
        return file_get_contents('./fregeifier-template.tex');
    }
    $try = getenv("HOME") . '/.config/fregeifier/fregeifier-template.tex';
    if (file_exists($try)) {
        return file_get_contents($try);
    }
    $try = dirname(__FILE__) . '/default-template.tex';
    if (file_exists($try)) {
        return file_get_contents($try);
    }
    return false;
}

function make_image($mathtext, $displayinline, $ctr) {
    if (!is_dir('images')) {
        mkdir('images',0755,true);
    }
    global $comperrors, $image_extension, $template, $extra_headers;
    $filename = 'images/fregeify' . strval($ctr) . '.' . $image_extension;
    // wrap math LaTeX code with proper delimiter
    if ($displayinline == 'display') {
        $mathtext = '\\[' . $mathtext . '\\]';
    }
    if ($displayinline == 'inline') {
        $mathtext = '\\(' . $mathtext . '\\)';
    }
    // create LaTeX document code from template
    $latex_code = fill_template($template, array(
        "HEADERINCLUDES"=>$extra_headers,
        "MATHTEXT"=>$mathtext
    ));
    $latexcmd = 'pdflatex';
    if (str_contains($latex_code, 'xelatex')) {
        $latexcmd = 'xelatex';
    }
    if (str_contains($latex_code, 'lualatex')) {
        $latexcmd = 'lualatex';
    }
    // compile LaTeX to PDF
    $comp_result = pipe_to_command(
        $latexcmd . ' -jobname=fregeifier_temporary_file -interaction=nonstophmode -no-shell-escape',
        $latex_code
    );
    if ($comp_result->returnvalue != 0) {
        $outputlines = explode(PHP_EOL,$comp_result->stdout);
        foreach($outputlines as $line) {
            if (strlen($line) == 0) { continue; }
            if ($line[0] == '!') {
                $comperrors .= $line . ' ';
            }
        }
        clean_up();
        error_log('Fregeifier unable to compile LaTeX.' .
                PHP_EOL . $comperrors . PHP_EOL);
        return false;
    }
    if (!file_exists('fregeifier_temporary_file.pdf')) {
        clean_up();
        error_log('Fregeifier intermediate PDF not found.' . PHP_EOL);
        return false;
    }
    // crop PDF
    $crop_result = pipe_to_command(
        'pdfcrop "fregeifier_temporary_file.pdf" ' .
            '"fregeifier_temporary_file_cropped.pdf"',
        ''
    );
    if ($crop_result->returnvalue !=0) {
        clean_up();
        error_log('Fregeifier error when cropping PDF.'. PHP_EOL .
            $crop_result->stderr . PHP_EOL);
        return false;
    }
    if (!file_exists('fregeifier_temporary_file_cropped.pdf')) {
        clean_up();
        error_log('Fregeifier cropped PDF not found.' . PHP_EOL);
        return false;
    }
    // convert to desired format
    $mutool_cmd = 'mutool draw -F ' . $image_extension . ' -o -';
    if ($image_extension != 'svg') {
        $mutool_cmd .= ' -r 100';
    }
    $mutool_cmd .= ' "fregeifier_temporary_file_cropped.pdf" 1 > ';
    $mutool_cmd .= '"' . $filename . '"';
    $convert_result = pipe_to_command($mutool_cmd, '');
    if ($convert_result->returnvalue != 0) {
        clean_up();
        error_log('Fregeifier error when converting image.' . PHP_EOL .
            $convert_result->stderr . PHP_EOL);
        return false;
    }
    if (!file_exists($filename)) {
        clean_up();
        error_log('Fregeifier result file not found.' . PHP_EOL);
        return false;
    }
    //clean_up();
    return $filename;
}

function pipe_to_command($cmd, $pipe_text) {
   $rv = new StdClass();

   $descriptorspec = array(
      0 => array("pipe", "r"), // stdin
      1 => array("pipe", "w"), // stdout
      2 => array("pipe", "w")  // stderr
   );

   $process = proc_open($cmd, $descriptorspec, $pipes);

   if (is_resource($process)) {
      fwrite($pipes[0], $pipe_text);
      fclose($pipes[0]);

      $rv->stdout = stream_get_contents($pipes[1]);
      $rv->stderr = stream_get_contents($pipes[2]);
      fclose($pipes[1]);
      fclose($pipes[2]);

      $rv->returnvalue = proc_close($process);

   }
   return $rv;

}

function save_record($rec) {
    if (!is_dir('images')) {
        mkdir('images',0755,true);
    }
    file_put_contents('images/fregeifier-record.json',
        json_encode($rec, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}

// initialize
$image_extension = 'svg';
$template = get_template();
if ($template === false) {
    rage_quit('Cannot find Fregeifier template to use.');
}
