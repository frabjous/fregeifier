// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

//////////////////////// libcache.mjs //////////////////////////////////
// Common functions involving cached fregeifier files on server       //
////////////////////////////////////////////////////////////////////////

import path from 'node:path';
import fs from './fs.mjs';
import randomString from './randomString.mjs';

function determineDatadir() {
  const datadirloc = path.join(process.env.HOME, 'data', 'fregeifier');
  if (fs.isdir(datadirloc)) return datadirloc;
  const homecache = path.join(process.env.HOME, '.cache', 'fregeifier');
  if (fs.ensuredir(homecache)) return homecache;
  return null;
}
const datadir = determineDatadir();
if (!datadir) {
  console.error('Could not determine data directory for Fregeifier.');
  process.exit(1)
}
process.fregeifierDatadir = datadir;

export function headersFromOpts(opts) {
  let foundgg = false;
  let hdrs = '';
  const fontopts = {
    baskerville: '\\usepackage[lf]{Baskervaldx}\n' +
      '\\usepackage[bigdelims,vvarbb]{newtxmath}\n' +
      '\\usepackage[cal=boondoxo]{mathalfa}\n' +
      '\\usepackage[italic]{mathastext}\n',
    computermodern: '\n',
    fira: '\\let\\oldmathfrak=\\mathfrak\n' +
      '\\usepackage[sfdefault,lining]{FiraSans}\n' +
      '\\usepackage[fakebold]{firamath-otf}\n' +
      '\\renewcommand{\\mathfrak}[1]{\\oldmathfrak{#1}}\n' +
      '% xelatex\n',
    garamond: '\\usepackage[cmintegrals,cmbraces]{newtxmath}\n' +
      '\\usepackage{ebgaramond-maths}\n',
    libertinus: '\\usepackage{libertinus}\n' +
      '\\usepackage{libertinust1math}\n',
    noto: '\\usepackage{notomath}\n',
    palatino: '\\usepackage{newpxtext,newpxmath}\n',
    times: '\\usepackage{newtxtext,newtxmath}\n',
    schoolbook: '\\usepackage{fouriernc}\n'
  }
  if (opts?.font && (opts.font in fontopts)) {
    hdrs += fontopts[opts.font];
  }
  if (opts?.packages && opts.packages != '') {
    const pkgs = opts.packages.split(',');
    for (const pkg of pkgs) {
      if (pkg.trim() == 'grundgesetze') {
        foundgg = true;
      }
      hdrs += `\\usepackage{${pkg.trim()}}\n`;
    }
  }
  if (opts?.extra && opts.extra != '') {
    hdrs += opts.extra + '\n';
    if (opts.extra.includes('grundgesetze')) {
      foundgg = true;
    }
  }
  if (foundgg) {
    if (opts?.thickness && opts.thickness != '') {
      hdrs += `\\setlength{\\GGthickness}{${opts.thickness}pt}\n`;
      const quantthickness = 0.75 * parseFloat(opts.thickness);
      hdrs += '\\setlength{\\GGquantthickness}{' +
        quantthickness.toFixed(2) + 'pt}\n';
    }
    if (opts?.linewidth && opts.linewidth != '') {
      hdrs += '\\setlength{\\GGbeforelen}{' +
        opts.linewidth + 'pt}\n';
      hdrs += '\\setlength{\\GGafterlen}{' +
        opts.linewidth + 'pt}\n';
    }
    if (opts?.lift && opts.lift != '') {
      hdrs += `\\setlength{\\GGlift}{${opts.lift}pt}\n`;
    }
  }
  return hdrs;
}

export function newkey() {
  purgeOldTemporaryFiles(`${datadir}/temporary`);
  let rv = '';
  do {
    rv = randomString(12);
  } while (fs.isdir(`${datadir}/temporary/${rv}`));
  return rv;
}

function purgeOldTemporaryFiles(dir, time) {
  if (!fs.isdir(dir)) return;
  const contents = fs.filesin(dir);
  for (const content of contents) {
    if (fs.mtime(content) > time) continue;
    fs.rm(content);
  }
  const subdirs = fs.subdirs(dir);
  for (const subdir of subdirs) {
    purgeOldTemporaryFiles(subdir, time);
    fs.rmdirSync(subdir, {});
  }
}

// setup and cleanup
/*
$datadir = determine_datadir();
if ($datadir === false) {
    rage_quit('Cannot find or create data folder.');
}
purge_old_temporary_files("$datadir/temporary", (time()- 86400));
*/
