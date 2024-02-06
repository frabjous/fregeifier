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



echo json_encode($obj, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
