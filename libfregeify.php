<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// libfregeify.php /////////////////////////////
// Common functions for image creation and discovery      //
////////////////////////////////////////////////////////////


// NOTE: should be loaded after navigating to correct directory

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
    save_record();
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

function makeimage($mathtext, $displayinline, $ctr) {
    global $image_extension;
    $filename = 'images/fregeify' + strval($ctr) . '.' + $image_extension;
    error_log('running makeimage');
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

