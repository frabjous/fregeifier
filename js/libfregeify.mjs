// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// libfregeify.mjs /////////////////////////////
// Common functions for image creation and discovery      //
////////////////////////////////////////////////////////////

import fs from './fs.mjs';
import path from 'node:path';
import {execSync} from 'node:child_process';

function cleanUp(jobdir) {
  const files = fs.filesin(jobdir);
  for (const fn of files) {
    if (!fn.includes('fregeifier_temporary_file')) continue;
    if (!fs.rm(fn)) return false;
  }
  return true;
}

function fillTemplate(template, vals) {
    let doc = template;
    for (const [key, v] of Object.entries(vals)) {
      doc = doc.replaceAll('% FREGEIFIER:' + key, v);
    }
    return doc;
}

export function getImageFile(jobOpts, mathText, displayinline) {
  const record = jobOpts.record;
  const imageext = jobOpts.imageext;
  const preexisting = record?.[mathText]?.[displayinline]?.[imageext];
  if (preexisting && fs.isfile(path.join(jobOpts.jobdir, preexisting))) {
    return preexisting;
  }
  let ctr = ("counter" in record) ? record.counter : 0;
  ctr++;
  record.counter = ctr;
  if (!record?.[mathText]) record[mathText] = {};
  if (!record[mathText]?.[displayinline]) {
    record[mathText][displayinline] = {};
  }
  if (!record[mathText]?.[displayinline]?.[imageext]) {
    record[mathText][displayinline][imageext] =
      makeImage(jobOpts, mathText, displayinline, ctr);
  }
  saveRecord(jobOpts.jobdir, record);
  if (!record[mathText][displayinline]?.[imageext]) {
    return 'fregeify_error.png';
  }
  return record[mathText][displayinline][imageext];
}

export function getRecord(jobdir) {
  const recordFile = path.join(jobdir, 'images', 'fregeifier-record.json');
  return fs.loadjson(recordFile) ?? {};
}

export function getTemplate(jobdir) {
  const envLocation = process?.env?.FREGEIFIER_TEMPLATE;
  if (envLocation && envLocation != '' && fs.isfile(envLocation)) {
    return fs.readfile(envLocation);
  }
  const localfile = path.join(jobdir, 'fregeifier-template.tex');
  if (fs.isfile(localfile)) {
    return fs.readfile(localfile);
  }
  const conffile = path.join(
    process.env.HOME,
    '.config', 'fregeifier', 'fregeifier-template.tex'
  );
  if (fs.isfile(conffile)) {
    return fs.readfile(conffile);
  }
  if (process?.__fregeifierdirname) {
    const lasttry = path.join(
      process.__fregeifierdirname, 'default-template.tex'
    );
    if (fs.isfile(lasttry)) {
      return fs.readfile(lasttry);
    }
  }
  return null;
}

function makeImage(jobOpts, mathText, displayinline, ctr) {
  const jobdir = jobOpts.jobdir;
  const imageext = jobOpts.imageext;
  const template = jobOpts.template;
  const extraHeaders = jobOpts?.extraheaders ?? '';
  const imagesdir = path.join(jobdir, 'images');
  if (!fs.ensuredir(imagesdir)) return null;
  const filename = path.join(
    'images',
    'fregeify' + ctr.toString() + '.' + imageext
  );
  if (displayinline == 'display') {
    mathText = '\\[' + mathText + '\\]';
  }
  if (displayinline == 'inline') {
    mathText = '\\(' + mathText + '\\)';
  }
  const latexCode = fillTemplate(template, {
    "HEADERINCLUDES": extraHeaders,
    "MATHTEXT": mathText
  });
  const latexFile = path.join(jobdir, 'fregeifier_temporary_file.tex');
  fs.savefile(latexFile, latexCode);
  const latexCmd = (latexCode.includes('xelatex'))
    ? 'xelatex' : (
      (latexCode.includes('lualatex'))
      ? 'lualatex' : 'pdflatex'
    );
  const fullCmd = `${latexCmd} -interaction=nonstopmode` +
    ` -no-shell-escape "fregeifier_temporary_file.tex"`;
  try {
    execSync(fullCmd, {
      encoding: 'utf-8',
      cwd: jobdir
    });
  } catch(err) {
    const errlines = err.stdout.split('\n').filter(
      (l) => l.startsWith('!')
    ).join(' ');
    cleanUp(jobdir);
    console.error('Unable to compile LaTeX:\n ' + errlines + '\n');
    process.latexCompileError = errlines;
    return null;
  }
  const pdffile = path.join(jobdir, 'fregeifier_temporary_file.pdf');
  if (!fs.isfile(pdffile)) {
    console.error('Fregeifier intermediate PDF file not found.');
    cleanUp(jobdir);
    return null;
  }
  const cropCmd = 'pdfcrop "fregeifier_temporary_file.pdf" ' +
    '"fregeifier_temporary_file_cropped.pdf"';
  try {
    execSync(cropCmd, {
      encoding: 'utf-8',
      cwd: jobdir
    });
  } catch(err) {
    cleanUp(jobdir);
    console.error('Fregeifier error when cropping PDF.\n\n' +
      err.stderr);
    return null;
  }
  const croppedfile = path.join(
    jobdir, 'fregeifier_temporary_file_cropped.pdf'
  );
  if (!fs.isfile(croppedfile)) {
    cleanUp(jobdir);
    console.error('Fregeifier cropped PDF not found.');
    return null;
  }
  let mutoolCmd = `mutool draw -F ${imageext} -o - ` +
    ((imageext == 'svg') ? '' : '-r 100 ') +
    '"fregeifier_temporary_file_cropped.pdf" 1 > ' +
    `"${filename}"`;
  try {
      execSync(mutoolCmd, {
        encoding: 'utf-8',
        cwd: jobdir
      });
  } catch(err) {
    cleanUp(jobdir);
    console.error('Fregeifier error when converting image.\n' +
      err.stderr);
    return null;
  }
  const ffn = path.join(jobdir, filename);
  if (!fs.isfile(ffn)) {
    cleanUp(jobdir);
    console.error('Fregeifier result file not found.');
    return null;
  }
  cleanUp(jobdir);
  return filename;
}

function saveRecord(jobdir, record) {
  const recordFile = path.join(jobdir, 'images', 'fregeifier-record.json');
  fs.savejson(recordFile, record);
}

