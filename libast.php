<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// libast.php ///////////////////////////////////
// Functions for modifying/reading pandoc ASTs             //
/////////////////////////////////////////////////////////////

require_once('libfregeify.php');

function fregeify_ast($obj, $active) {
    if (is_object($obj)) {
        // see if do a change
        if (($active) && isset($obj->t) && ($obj->t == 'Math')) {
            // ensure a content component
            if (!isset($obj->c)) {
                return $obj;
            }
            $c = $obj->c;
            //guard against weird math objects
            if (!is_array($c)) {
                return $obj;
            }
            if (count($c) < 2) {
                return $obj;
            }
            if (!is_string($c[1])) {
                return $obj;
            }
            $displayinline = 'display';
            if (is_object($c[0]) && isset($c[0]->t) &&
                (str_contains($c[0]->t, 'Inline'))) {
                $displayinline = 'inline';
            }
            // get image for text
            $math_text = $c[1];
            $img_file = get_image_file($math_text, $displayinline);
            // create image object
            $newobj = new StdClass();
            $newobj->t = 'Image';
            $newobj->c = array();
            array_push($newobj->c, array('',array('fregeified-math',
                $displayinline),array()));
            $alttext_obj = new StdClass();
            $alttext_obj->t = 'Str';
            $alttext_obj->c = $math_text;
            array_push($newobj->c, array($alttext_obj));
            array_push($newobj->c, array($img_file, ''));
            return $newobj;
        }
        // otherwise recurse on c object
        if (isset($obj->c)) {
            $obj->c = fregeify_ast($obj->c, $active);
        }
        return $obj;
    }
    if (is_array($obj)) {
        // if first object is class specification with fregeify,
        // make it active
        if ((count($obj) > 0) &&
            (is_array($obj[0])) &&
            (count($obj[0]) > 1)) {
            $classes = $obj[0][1];
            foreach($classes as $cl) {
                if (!is_string($cl)) {
                    continue;
                }
                if (str_contains($cl, 'fregeify') || str_contains($cl, 'fregify')) {
                    $active = true;
                }
            }
        }
        // replace all array elements
        for ($i=0; $i<count($obj); $i++) {
            $obj[$i] = fregeify_ast($obj[$i], $active);
        }
        return $obj;
    }
    //other types are unchanged
    return $obj;
}

function get_extra_headers($obj, $eh) {
    if (is_array($obj)) {
        // check if header is a tex inclusion and grab it
        if (($obj[0] == 'tex') && is_string($obj[1])) {
            if ($eh != '') {
                $eh .= PHP_EOL;
            }
            return $eh .= $obj[1];
        }
        // for other arrays recurse into elements
        foreach ($obj as $subobj) {
            $subeh = get_extra_headers($subobj, '');
            if (($eh != '') && ($subeh != '')) {
                $eh .= PHP_EOL;
            }
            if ($subeh != '') {
                $eh .= $subeh;
            }
        }
        return $eh;
    }
    // if object, recurse into "c" object
    if (is_object($obj)) {
        if (isset($obj->c)) {
            return get_extra_headers($obj->c, $eh);
        }
    }
    return $eh;
}


