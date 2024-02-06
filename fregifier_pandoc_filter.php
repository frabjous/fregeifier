#!/usr/bin/env php
<?php

function rage_quit($msg) {
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
}

$stdin = file_get_contents('php://stdin');

$obj = json_decode($stdin) ?? false;

if (!$obj) {
    rage_quit('Could not decode JSON object from standard in.');
}

require_once('libast.php');

file_put_contents('/home/kck/tmp/pre.json', json_encode($obj,
    JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));


$extra_headers = '';
if (isset($obj->meta->{'header-includes'})) {
    $extra_headers = get_extra_headers($obj->meta->{'header-includes'}, '');
}

file_put_contents('/home/kck/tmp/eh.txt', $extra_headers);

if (isset($obj->blocks)) {
    $obj->blocks = fregeify_ast($obj->blocks, false);
}

file_put_contents('/home/kck/tmp/post.json', json_encode($obj,
    JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));


echo json_encode($obj, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
