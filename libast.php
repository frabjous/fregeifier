<?php

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
            $displaymath = true;
            if (is_object($c[0]) && isset($c[0]->t) &&
                (str_contains($c[0]->t, 'Inline'))) {
                $displaymath = false;
            }
            $math_text = $c[1];
            $img_file = get_image_file($math_text);
        }
    }
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


