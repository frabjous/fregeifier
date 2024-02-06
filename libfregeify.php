<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// libfregeify.php /////////////////////////////
// Common functions for image creation and discovery      //
////////////////////////////////////////////////////////////


// NOTE: should be loaded after navigating to correct directory

function get_image_file($mathtext. $displayinline) {
    return 'image.svg';
}

function get_record() {
    if (file_exists('images/fregeifier-record.json')) {
        $json = get_file_contents('images/fregeifier-record.json') ?? '';
        $rec = json_decode($json) ?? false;
        if (!$rec) { return new StdClass(); }
        return $rec;
    }
    return new StdClass();
}

function save_record($rec) {
    file_put_contents('images/fregeifier-record.json',
        json_encode($rec, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}
}
