<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// request.php //////////////////////////////////
// responds to requests from web interface to create image //
/////////////////////////////////////////////////////////////

header('Content-Type: application/json');
$response = new StdClass();

function rage_quit($msg) {
    global $response;
    $response->error = true;
    $response->errmsg = $msg;
    echo json_encode($response,
        JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit(0);
}


// read request
$inputbody = file_get_contents('php://input') ?? '{}';
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

if (strlen($opts->latexcode) > 3000){
    rage_quit('Code provided was too long for web interface. ' +
        'Consider using a local installation of Fregeifier instead.');
}

$filename = get_image_file($opts->latexcode, 'display');
if ($record->{$opts->latexcode}->{'display'}->{$image_extension} === false) {
    error_log('=========='.json_encode($record->{$opts->latexcode}->{'display'}->{$image_extension}));
    rage_quit('Unable to create image. Please check your code for errors.'
        .' StdErr: <pre style="max-height: 10rem; overflow: auto;">' . 
        $comperrors . '</pre>');
}

$response->filename = $filename;
$response->url = 'getimage.php?tempkey=' .$tempkey . '&imageext=' .
    $image_extension;

chdir($oldpwd);
echo json_encode($response, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
exit(0);



