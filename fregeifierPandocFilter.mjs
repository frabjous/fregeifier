#!/usr/bin/env node

// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: fregeifierPandocFilter.mjs
// the executable that can be used with: 
// pandoc --filter /path/to/fregeifier/fregeifierPandocFilter

//
function fregeifierFilter(ast) {
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

