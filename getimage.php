<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// getimage.php /////////////////////////////////
// serves images created by the fregeifier's web interface //
/////////////////////////////////////////////////////////////

$ops = new StdClass();

function rage_quit($msg) {
    http_response_code(404);
    echo('<html><head><title>404 Not Found</title></head><body>' .
            '<h1>404 Not Found</h1><p>' . $msg . '</p></body></html>';
    exit(0);
}


// read request
$inputbody = file_get_contents('php://input') ?? '{}';
file_put_contents('/home/kck/tmp/req.json', $inputbody);
$opts = json_decode($inputbody) ?? false;
if (!$opts) {
    rage_quit('Invalid JSON request.');
}
if ((!isset($opts->latexcode)) || ($opts->latexcode == '')) {
    rage_quit('No LaTeX code sent.');
}

require_once('libcache.php');

$template = get_template();
$image_extension = (isset($opts->imageext) ? $opts->imageext : 'svg');
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
    rage_quit('Unable to create image. Please check your code for errors.'
        .' StdErr: <pre style="max-height: 10rem; overflow: auto;">' . 
        $comperrors . '</pre>');
}

$response->filename = $filename;
$response->url = 'getimage.php?tempkey=' .$tempkey . '&ext=' .
    $image_extension;

header('Content-Type: application/json');

chdir($oldpwd);
exit(0);




