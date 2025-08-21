// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: libast.mjs
// Functions for modifying/reading pandoc Abstract Syntax Trees (ast)

import {getImageFile} from './libfregeify.mjs';

export function fregeifyAST(jobOpts, ast, active) {
  if ((typeof ast == 'object') && !Array.isArray(ast)) {
    // check if need to Fregeify this obkect
    if (active && ("t" in ast) && ast.t == "Math") {
      if (!("c" in ast)) return ast;
      const c = ast.c;
      // ensure a content component
      if (!Array.isArray(c)) return ast;
      if (c.length < 2) return ast;
      if (!(typeof c[1] == 'string')) return ast;
      const displayinline = (
        (typeof c[0] == 'object') &&
        ("t" in c[0]) &&
        c[0].t.includes('Inline'))
        ? 'inline' : 'display';
      const mathText = c[1];
      const imageFile = getImageFile(jobOpts, mathText, displayinline);
      const imgObj = {
        t: 'Image',
        c: [
          [
            '',
            [
              'fregeified-math',
              displayinline
            ],
            []
          ]
        ]
      }
      const alttextObj = {
        t: 'Str',
        c: mathText
      }
      imgObj.c.push([alttextObj]);
      imgObj.c.push([imageFile, '']);
      return imgObj;
    }
    // otherwise recurse
    if ((ast) && ("c" in ast)) {
      ast.c = fregeifyAST(jobOpts, ast.c, active)
    }
    return ast;
  }
  if (Array.isArray(ast)) {
    // if first object is class specification with fregeify
    // make it active
    if (ast.length > 0 && Array.isArray(ast[0]) && ast[0].length > 1) {
      const classes = ast[0][1];
      if (Array.isArray(classes)) {
        for (const cl of classes) {
          if (typeof cl != 'string') continue;
          if (cl.includes('fregeify') || cl.includes('fregify')) {
            active = true;
            break;
          }
        }
      }
    }
    // replace array elements
    for (let i = 0; i < ast.length; i++) {
      ast[i] = fregeifyAST(jobOpts, ast[i], active);
    }
  }
  // non-arrays, non-objects stay as is
  return ast;
}

export function getExtraHeaders(ast, extraheader) {
  if (Array.isArray(ast)) {
    // if a tex-inclusion, add it
    if (ast?.[0] == 'tex' && (typeof ast?.[1] == 'string')) {
      extraheader += (extraheader == '') ? '' : '\n';
      return (extraheader + ast[1]);
    }
    // for other arrays, recurse
    for (const subast of ast) {
      const subextraheader = getExtraHeaders(subast, '');
      if (extraheader != '' && subextraheader != '') {
        extraheader += '\n';
      }
      if (subextraheader != '') {
        extraheader += subextraheader;
      }
    }
    return extraheader;
  }
  if ((typeof ast == 'object') && ("c" in ast)) {
    return getExtraHeaders(ast.c, extraheader);
  }
  return extraheader;
}

