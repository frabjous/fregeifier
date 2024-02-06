<?php

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
