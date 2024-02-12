<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////////////// libcache.php //////////////////////////////////
// Common functions involving cached fregeifier files on server       //
////////////////////////////////////////////////////////////////////////

function determine_datadir() {
    if (is_dir('../../data/fregeifier')) {
        return realpath('../../data/fregeifier');
    }
    $home_cache = getenv("HOME") . '/.cache/fregeifier';
    if (is_dir($home_cache)) {
        return realpath($home_cache);
    }
    if (mkdir($home_cache, 0755, true)) {
        return realpath($home_cache);
    }
    return false;
}

function purge_old_temporary_files($dir, $time) {
    if (!is_dir($dir)) { return; }
    $contents = scandir($dir);
    foreach($contents as $content) {
        if (filemtime("$dir/$content") > $time) { continue; }
        if ($content == '.' || $continue == '..') { continue; }
        if (is_dir($content)) {
            purge_old_temporary_files("$dir/$content", $time);
            rmdir("$dir/$content");
        } else {
            unlink("$dir/$content");
        }
    }
}

// setup

$datadir = determine_datadir();
if ($datadir === false) {
    rage_quit('Cannot find or create data folder.');
}
purge_old_temporary_files("$datadir/temporary", (time()- 2));

