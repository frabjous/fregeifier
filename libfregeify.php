<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// libfregeify.php /////////////////////////////
// Common functions for image creation and discovery      //
////////////////////////////////////////////////////////////


// NOTE: should be loaded after navigating to correct directory

function fill_template($template, $vals) {
    $doc = $template;
    foreach($vals as $key => $v) {
        $doc = preg_replace('/%\s*FREGEIFIER:' . $key . '/', $v, $doc);
    }
    return $doc;
}

function get_image_file($mathtext, $displayinline) {
    global $record;
    // if already there, just return what we have
    if (isset($record->{$mathtext}->{$displayinline})) {
        if (file_exists($record->{$mathtext}->{$displayinline})) {
            return $record->{$mathtext}->{$displayinline};
        }
    }
    $ctr=0;
    if (isset($record->counter)) {
        $ctr = $record->counter;
    }
    $ctr++;
    $record->counter = $ctr;
    if (!isset($record->{$mathtext})) {
        $record->{$mathtext} = new StdClass();
    }
    $record->{$mathtext}->{$displayinline} = make_image(
        $mathtext, $displayinline, $ctr
    );
    save_record($record);
    if ($record->{$mathtext}->{$displayinline} == false) {
        return 'fregeify_error.png';
    }
    return $record->{$mathtext}->{$displayinline};
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
    global $image_extension;
    $filename = 'images/fregeify' . strval($ctr) . '.' . $image_extension;
    if ($displayinline == 'display') {
        $mathtext = '\\[' . PHP_EOL . $mathtext . PHP_EOL . '\\]';
    }
    if ($displayinline == 'inline') {
        $mathtext = '\\(' . $mathtext . '\\)';
    }
    return $filename;
}

function save_record($rec) {
    if (!is_dir('images')) {
        mkdir('images',0755,true);
    }
    file_put_contents('images/fregeifier-record.json',
        json_encode($rec, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}

// initialize
$record = get_record();
$image_extension = 'svg';
$template = get_template();
if ($template === false) {
    rage_quit('Cannot find Fregeifier template to use.');
}
error_log($template);
