#!/usr/bin/env node

// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: fregeifierPandocFilter.mjs
// the executable that can be used with: 
// pandoc --filter /path/to/fregeifier/fregeifierPandocFilter.mjs

import {fregeifyAST, getExtraHeaders} from './js/libast.mjs';
import {getRecord, getTemplate} from './js/libfregeify.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// get script directory
const __fregeifierfilename = fileURLToPath(import.meta.url);
const __fregeifierdirname = path.dirname(__fregeifierfilename);
process.__fregeifierdirname = __fregeifierdirname;

function fregeifierFilter(ast) {
  let readerOpts = {};
  const readerOptsJSON = process?.env?.PANDOC_READER_OPTIONS;
  if (readerOptsJSON && readerOptsJSON != '') {
    try {
      readerOpts = JSON.parse(readerOptsJSON);
    } catch(err) {
      readerOpts = {};
    }
  }
  const jobOpts = {};
  const defImgExt = readerOpts?.["default-image-extension"];
  jobOpts.imageext = (defImgExt && defImgExt != '') ? defImgExt : 'svg';
  if (ast?.meta?.['header-includes']) {
    jobOpts.extraheaders = getExtraHeaders(ast.meta['header-includes'], '');
  }
  jobOpts.jobdir = process.cwd();
  jobOpts.template = getTemplate(jobOpts.jobdir);
  if (!jobOpts.template) {
    console.error('Cannot find Fregeifier template.');
    process.exit(1);
  }
  jobOpts.record = getRecord(jobOpts.jobdir);
  if (ast?.blocks) {
      ast.blocks = fregeifyAST(jobOpts, ast.blocks, false);
  }
  return ast;
}

//read stdin and begin conversion when read
let injson = '';

process.stdin.on("data", data => {
    injson += data.toString();
})

process.stdin.on('end', () => {
  let inAst = null;
  try {
    inAst = JSON.parse(injson);
  } catch(err) {
    console.error('Error reading stdin as json', err);
    process.exit(1);
  }
  const outAst = fregeifierFilter(inAst);
  console.log(JSON.stringify(outAst));
});

