// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

////////////// jsonResponse.mjs /////////////////////////////
// responds to requests from web interface to create image //
/////////////////////////////////////////////////////////////

import {headersFromOpts, newkey} from './libcache.mjs';
import {getImageFile, getRecord, getTemplate} from './libfregeify.mjs';
import path from 'node:path';
import fs from './fs.mjs';

function errResp(msg) {
  return {
    error: true,
    errmsg: msg
  }
}

export default function jsonResponse(opts) {
  if (!opts?.latexcode) return errResp('No LaTeX code sent.');
  const datadir = process.fregeifierDatadir;
  const tempkey = newkey();
  const jobdir = path.join(
    process.fregeifierDatadir,
    'temporary',
    tempkey
  );
  if (!fs.ensuredir(jobdir)) {
    return errResp('Unable to create temporary directory.');
  }
  const template = getTemplate(jobdir);
  const imageext = opts?.imageext ?? 'svg';
  const record = getRecord(jobdir);
  const extraheaders = headersFromOpts(opts);
  const latexcode = opts.latexcode;
  if (latexcode.length > 3000) {
    return errResp('Code provided was too long for web interface. ' +
      'Consider using a local installation of Fregeifier instead.');
  }
  const filename = getImageFile({
    imageext, extraheaders, record, jobdir, template
  }, latexcode, 'display');
  if (!record?.[latexcode]?.display?.[imageext]) {
    return errResp('Unable to create image. ' +
      'Please check your code for errors. ' +
      (process.latexCompileError ?? ''));
  }
  const basename = path.basename(filename);
  return {
    filename: basename,
    url: '/fregeifier/processed/' + basename +
      '?tempkey=' + tempkey
  }
}

