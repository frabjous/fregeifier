<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// getimage.php /////////////////////////////////
// serves images created by the fregeifier's web interface //
/////////////////////////////////////////////////////////////

$mimetypes = array(
    "eps" => "application/postscript",
    "gif" => "image/gif",
    "jpg" => "image/jpeg",
    "pdf" => "application/pdf",
    "png" => "image/png",
    "svg" => "image/svg+xml"
);

$opts = new StdClass();

function rage_quit($msg) {
    http_response_code(404);
    echo('<html><head><title>404 Not Found</title></head><body>' .
            '<h1>404 Not Found</h1><p>' . $msg . '</p></body></html>');
    exit(0);
}

function send_file($fn) {
    global $image_extension, $mimetypes, $download;
    if ($download) {
        header('Content-Disposition: attachment; filename=' .
            basename($fn));
    }
    header('Content-Type: ' . $mimetypes[$image_extension]);
    header('Content-Length: ' . filesize($fn));
    readfile($fn);
    exit(0);
}

// read details of submission
foreach(array('latexcode','thickness','extra',
    'linewidth','font','imageext','packages') as $thisopt) {
    if (isset($_GET[$thisopt])) {
        $opts->{$thisopt} = $_GET[$thisopt];
    }
}

$download = (isset($_GET["dl"]) && ($_GET["dl"] == 'true'));

$tempkey = '';
if (isset($_GET["tempkey"])) {
    $tempkey = $_GET["tempkey"];
}

$image_extension = 'svg';
if (isset($opts->imageext)) { $image_extension = $opts->imageext; }

require_once('libcache.php');

// send existing image if tempkey provided
if ($tempkey != '') {
    if (!is_dir("$datadir/temporary/$tempkey/images")) {
        rage_quit('Nonexistent or outdated image key given.');
    }
    $g = glob("$datadir/temporary/$tempkey/images/" . '*.' .
        $image_extension);
    if (count($g) == 0) {
        rage_quit('File with requested extension and image key not found.');
    }
    send_file($g[0]);
}

// otherwise code is needed
if ((!isset($opts->latexcode)) || $opts->latexcode == '') {
    rage_quit('No tempkey or latex code provided.');
}

// ensure not too long
if (strlen($opts->latexcode) > 3000){
    rage_quit('Code provided was too long for web interface. ' +
        'Consider using a local installation of Fregeifier instead.');
}

$template = get_template();
$tempkey = newkey();
$oldpwd = getcwd();
// operate in the temporary folder
if (!is_dir("$datadir/temporary/$tempkey")) {
    if (!mkdir("$datadir/temporary/$tempkey", 0755, true)) {
        rage_quit("Could not create temporary folder.");
    }
}
chdir("$datadir/temporary/$tempkey");
$record = get_record();
$comperrors = '';
$extra_headers = headers_from_opts($opts);

$filename = get_image_file($opts->latexcode, 'display');
if ($record->{$opts->latexcode}->{'display'}->{$image_extension} === false) {
    rage_quit('Unable to create image. Please check your code for errors.');
}

send_file($filename);

chdir($oldpwd);
exit(0);




