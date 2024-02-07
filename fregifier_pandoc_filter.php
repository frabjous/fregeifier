#!/usr/bin/env php
<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// fregeifier_pandoc_filter.php /////////////////
// Pandoc filter for use with pandoc --filter option       //
/////////////////////////////////////////////////////////////

function rage_quit($msg) {
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
}

$stdin = file_get_contents('php://stdin');

$obj = json_decode($stdin) ?? false;

if (!$obj) {
    rage_quit('Could not decode JSON object from standard in.');
}

// also loads libfregeify.php, which sets some variables
// and sets image extension to svg as default
require_once('libast.php');

// try to read image extension from pandoc command
$reader_options = json_decode(getenv('PANDOC_READER_OPTIONS') ?? '') ?? false;

if ($reader_options !== false) {
    if (isset($reader_options->{'default-image-extension'})) {
        if ($reader_options->{'default-image-extension'} != '') {
            $image_extension = $reader_options->{'default-image-extension'};
        }
    }
}

file_put_contents('/home/kck/tmp/pre.json', json_encode($obj,
    JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));


$extra_headers = '';
if (isset($obj->meta->{'header-includes'})) {
    $extra_headers = get_extra_headers($obj->meta->{'header-includes'}, '');
}

if (isset($obj->blocks)) {
    $obj->blocks = fregeify_ast($obj->blocks, false);
}



file_put_contents('/home/kck/tmp/post.json', json_encode($obj,
    JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));

error_log('IMAGE EXT: ' . $image_extension);

echo json_encode($obj, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
