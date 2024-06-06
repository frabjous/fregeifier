<?php
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////////////// libcache.php //////////////////////////////////
// Common functions involving cached fregeifier files on server       //
////////////////////////////////////////////////////////////////////////

require_once('libfregeify.php');

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

function headers_from_opts($opts) {
    $foundgg = false;
    $hdrs = '';
    $fontopts = array(
        "baskerville" => '\usepackage[lf]{Baskervaldx}' .PHP_EOL .
            '\usepackage[bigdelims,vvarbb]{newtxmath}' . PHP_EOL .
            '\usepackage[cal=boondoxo]{mathalfa}' . PHP_EOL .
            '\usepackage[italic]{mathastext}',
        "computermodern" => '',
        "fira"=>'\let\oldmathfrak=\mathfrak' . PHP_EOL .
            '\usepackage[sfdefault,lining]{FiraSans}' . PHP_EOL .
            '\usepackage[fakebold]{firamath-otf}' . PHP_EOL .
            '\renewcommand{\mathfrak}[1]{\oldmathfrak{#1}}' . PHP_EOL .
            '% xelatex' . PHP_EOL,
        "garamond"=> '\usepackage[cmintegrals,cmbraces]{newtxmath}' . PHP_EOL .
            '\usepackage{ebgaramond-maths}' . PHP_EOL,
        "libertinus"=>'\usepackage{libertinus}' . PHP_EOL .
            '\usepackage{libertinust1math}' . PHP_EOL,
        "noto"=> '\usepackage{notomath}' . PHP_EOL,
        "palatino"=>'\usepackage{newpxtext,newpxmath}' . PHP_EOL,
        "times"=>'\usepackage{newtxtext,newtxmath}' . PHP_EOL,
        "schoolbook"=>'\usepackage{fouriernc}' . PHP_EOL
    );
    if (isset($opts->font)) {
        if (isset($fontopts[$opts->font])) {
            $hdrs .= $fontopts[$opts->font];
        }
    }
    if (isset($opts->packages) && ($opts->packages != '')) {
        $pkgs = explode(',', $opts->packages);
        foreach($pkgs as $pkg) {
            if (trim($pkg) == 'grundgesetze') {
                $foundgg = true;
            }
            $hdrs .= '\usepackage{' . trim($pkg) . '}' . PHP_EOL;
        }
    }
    if (isset($opts->extra) && ($opts->extra != '')) {
        $hdrs .= $opts->extra;
        if (str_contains($opts->extra, 'grundgesetze')) {
            $foundgg = true;
        }
    }
    if ($foundgg) {
        if (isset($opts->thickness) && ($opts->thickness != '')) {
            $hdrs .= '\setlength{\GGthickness}{' .
                $opts->thickness . 'pt}' . PHP_EOL;
            $quantthickness = 0.75*floatval($opts->thickness);
            $hdrs .= '\setlength{\GGquantthickness}{' .
                strval($quantthickness) . 'pt}' . PHP_EOL;
        }
        if (isset($opts->linewidth) && ($opts->linewidth != '')) {
            $hdrs .= '\setlength{\GGbeforelen}{' .
                $opts->linewidth . 'pt}' . PHP_EOL .
                '\setlength{\GGafterlen}{' . $opts->linewidth .
                'pt}' . PHP_EOL;
        }
        if (isset($opts->lift) && ($opts->lift != '')) {
            $hdrs .= '\setlength{\GGlift}{' . $opts->lift . 'pt}' .
                PHP_EOL;
        }
    }
    return $hdrs;
}

function newkey() {
    global $datadir;
    $rv = '';
    do {
        $rv = random_string(12);
    } while (is_dir("$datadir/temporary/$rv"));
    return $rv;
}

function purge_old_temporary_files($dir, $time) {
    if (!is_dir($dir)) { return; }
    $contents = scandir($dir);
    foreach($contents as $content) {
        if (filemtime("$dir/$content") > $time) { continue; }
        if ($content == '.' || $content == '..') { continue; }
        if (is_dir("$dir/$content")) {
            purge_old_temporary_files("$dir/$content", $time);
            rmdir("$dir/$content");
        } else {
            unlink("$dir/$content");
        }
    }
}

function random_string($n = 12) {
    $pickfrom = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' .
        'abcdefghijklmnopqrstuvwxyz0123456789';
    $rv = '';
    while (strlen($rv) < $n) {
        $rv .= $pickfrom[random_int(0, (strlen($pickfrom) -1))];
    }
    return $rv;
}

// setup and cleanup
$datadir = determine_datadir();
if ($datadir === false) {
    rage_quit('Cannot find or create data folder.');
}
purge_old_temporary_files("$datadir/temporary", (time()- 86400));

