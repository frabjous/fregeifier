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
    echo json_encode($msg, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit(0);
}

require_once('libcache.php');

// read request
$inputbody = file_get_contents('php://stdin') ?? '{}';
$opts = json_decode($inputbody) ?? false;
if (!$opts) {
    rage_quit('Invalid JSON request.');
}

$template = get_template();
$image_extension = (isset($opts->imageext) ? $opts->imageext : 'svg');
$tempkey = newkey();
$oldpwd = getcwd();

$extra_headers = headers_from_opts($opts);

// operate in the temporary folde
chdir("$datadir/temporary/$tempkey");
chdir($oldpwd);

