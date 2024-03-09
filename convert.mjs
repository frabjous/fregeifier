// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

const operators = ['→','¬','∀','=','ἀ','ἐ','ἠ','ὠ'];

// changes all soft parentheses
function allsoftparens(s) {
    return s.replace(/[\{\[]/g,'(').replace(/[}\]]/g,')');
}

function nospaces(s) {
    return s.replace(/ /g,'');
}

function stripmatching(s) {
    let depth = 0;
    if (s.length < 2) { return s; }
    for (let i=0; i< (s.length - 1); i++) {
        if (s[i] == '(') { depth++; }
        if (s[i] == ')') { depth--; }
        // depth will be 0 if opener was not '('
        // or we got back to zero before end
        if (depth == 0) { return s; }
    }
    if (s.at(-1) != ')') {
        // first paren never got matched
        // not well formed here but oh well
        return s;
    }
    // matching; return strip recursively
    return stripmatching(s.substring(1, s.length - 1));
}

function stripquantparens(s) {
    return s.replace(/\((∀[a-zA-Z])\)/g, "$1");
}

export function normalize(s) {
    return stripmatching(
        stripquantparens(
            allsoftparens(
                nospaces(s)
            )
        )
    )
}

export class Parse {
    // start by recording what string got parsed
    constructor(s) {
        // input string is what were given, except with soft
        // parentheses, extra spaces and matching outer parens removed
        this.parsedstr = stripmatching(s);
    }

    ///////////////////////
    // getter functions  //
    ///////////////////////

    // gets the variable a quantifier main-opped formula binds, if any
    get boundvar() {
        // return old result if already calculated
        if ("_boundvar" in this) {
            return this._boundvar;
        }
        if ((this.op == '∀') && (this.opspot == 0) && 
            (/[A-Za-z]/.test(this.parsedstr.at(1)))) {
            this._boundvar = this.parsedstr.at(1);
            return this._boundvar;

        }
        this._boundvar = false;
        return this._boundvar;
    }

    // reads formula to left of main operator
    get left() {
        // return saved value if already calculated
        if ("_left" in this) {
            return this._left;
        }
        // if nothing on left, or no main op, return something falsy
        if (this.opspot < 1) {
            this._left = false;
            return this._left;
        }
        // cut string at the operator spot
        const leftstring =
            this.parsedstr.substring(0,this.opspot).trim();
        // use repository if already one for string in question
        this._left = new Parse(leftstring);
        return this._left;
    }

    // gets main operator by determining the main operator
    // spot and gets that character
    get op() {
        // if nothing to parse, mainop is falsey
        if ((!this.parsedstr) || (this.parsedstr == '')) { return false; }
        // return saved val
        if ("_op" in this) { return this._op; }
        const opspot = this.opspot;
        // if not found, treat main op as falsy
        if (opspot == -1) { return false; }
        // return character there
        this._op = this.parsedstr[opspot];
        return this._op;
    }

    // gets the spot of the main operator, either from what was
    // previously stored as _opspot, or by scanning
    get opspot() {
        // return previously calculated spot if exists
        if ("_opspot" in this) {
            return this._opspot;
        }
        // -1 means no operator found so far
        this._opspot = -1;
        let currdepth = 0;
        // the main op depth *should* always be zero; but might
        // not be if formula is unbalanced, but we soldier on
        // in case it's a "recoverable error"
        let mainopdepth = 999;
        for (let i=0; i<this.parsedstr.length; i++) {
            // get this character, and the remainder of the string
            const c = this.parsedstr.at(i);
            const remainder = this.parsedstr.substring(i);
            // letter before to check if right after a predicate
            if (c == '(') {
                // increase depth with left parenthesis
                currdepth++;
            } else if (c == ')') {
                // decrease depth with right parenthesis
                currdepth--;
            }
            const isop = (operators.indexOf(c) >= 0);
            // found something at this spot
            if ((isop) &&
                ((currdepth < mainopdepth) ||
                ((currdepth == mainopdepth) &&
                    (this.parsedstr.at(this._opspot) != '→') &&
                    ((c=='→') || (c=='='))))) {
                this._opspot = i;
                mainopdepth = currdepth;
            }
        }
        return this._opspot;
    }

    // gets formula right of main operator
    get right() {
        // do not reparse
        if ("_right" in this) {
            return this._right;
        }
        // if no main op, return something falsy
        if (this.opspot == -1) {
            this._right = false;
            return this._right;
        }
        // by default we remove one character
        let skip = 1;
        // for quantifiers one must remove two
        if (this.op == '∀') {
            skip = 2;
        }
        // break the string
        const rightstring =
            this.parsedstr.substring(this.opspot+skip).trim();
        // if nothing left, that's a problem
        // get formula
        this._right = new Parse(rightstring);
        return this._right;
    }

}

function handleunicode(s, gothics) {
    let rv = s.replace(/ἀ/g, '\\spirituslenis{\\alpha}');
    rv = rv.replace(/ἐ/g, '\\spirituslenis{\\epsilon}');
    rv = rv.replace(/ἠ/g, '\\spirituslenis{\\eta}');
    rv = rv.replace(/ὠ/g, '\\spirituslenis{\\omega}');
    rv = rv.replace(/α/g, '\\alpha ');
    rv = rv.replace(/ε/g, '\\epsilon ');
    rv = rv.replace(/η/g, '\\eta ');
    rv = rv.replace(/ω/g, '\\omega ');
    return rv;
}

export function converttogg(f, addjudge, startline, gothics) {
    if (!f.op) { return handleunicode(f.parsedstr); }
    let rv ='';
    // smoothbreathers
    if (operators.indexOf(f.op) >= 4) {
        // should not have a left, but in case it does
        if ((f.left) && (f.left.parsedstr != '')) {
            rv .= converttogg(f.left, false, true);
        }
        rv .= handleunicode(f.op);
        // handle right; add parens if has operator
        if ((f.right) && (f.right.parsedstr != '')) {
            if (r.right.op) {
                rv .= '\\GGbracket{';
            }
            rv .= parsedstr
            if (r.right.op) {
                rv .= '}';
            }
        }
    }
}

const s = normalize('((∀x)¬(¬[ἀ(α=α) = ἐf(ε)] → ¬Fx))');
const fml = new Parse(s);

function pretty(f,ia) {
    let gap = '';
    while (gap.length < ia) {
        gap += ' ';
    }
    if (!f.op) {
        console.log(gap + 'remainder: ' + f.parsedstr);
        return;
    }
    console.log(gap + 'op: ' + f.op);
    if (f.left) { pretty(f.left, ia + 2); }
    if (f.right) { pretty(f.right, ia+2); }
}

pretty(fml,0);

// quant = (before + after + 8) - (2*thickness)
// negation/conditional = (before + after)
// judge = after + thickness
// add 3 at end

