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
    let rv = s;
    if (gothics !== false) {
        for (const gothic of gothics) {
            const regex = new RegExp(gothic, 'g');
            rv = rv.replace(regex, '\\mathfrak{' + gothic + '}');
        }
    }
    rv = rv.replace(/ἀ/g, '\\spirituslenis{\\alpha}');
    rv = rv.replace(/ἐ/g, '\\spirituslenis{\\epsilon}');
    rv = rv.replace(/ἠ/g, '\\spirituslenis{\\eta}');
    rv = rv.replace(/ὠ/g, '\\spirituslenis{\\omega}');
    rv = rv.replace(/α/g, '\\alpha ');
    rv = rv.replace(/ε/g, '\\epsilon ');
    rv = rv.replace(/η/g, '\\eta ');
    rv = rv.replace(/ω/g, '\\omega ');
    return rv;
}

function portionwidth(f, beforeafter, thickness) {
    // only ∀, ¬, → add to width
    if ((!f.op) || (operators.indexOf(f.op) >= 3)) {
        return 0;
    }
    const lwidth = ((f.left) ?
        portionwidth(f.left, beforeafter, thickness) : 0);
    const rwidth = ((f.right) ?
        portionwidth(f.right, beforeafter, thickness) : 0);
    const cwidth = Math.max(lwidth, rwidth);
    if (f.op == '∀') {
        return cwidth + (2*(beforeafter)) + 8 - (2*(thickness));
    }
    return cwidth + (2*(beforeafter));
}

function formulawidth(f, addjudge) {
    let beforeafter = 5;
    let thickness = 0.6;
    if (typeof document != 'undefined') {
        if (document?.getElementById('thickness')) {
            thickness = parseFloat(document.getElementById('thickness').value);
        }
        if (document?.getElementById('linewidth')) {
            beforeafter = parseFloat(document.getElementById('linewidth').value);
        }
    }
    return portionwidth(f, beforeafter, thickness) - 3 +
        ((addjudge) ? (beforeafter + thickness) : 0);
}

export function converttogg(f, addjudge, startline, gothics) {
    let rv ='';
    let oppl = -1;
    if (!f.op) {
        if (addjudge) { rv += '\\GGjudge'; }
        rv += ' ' + handleunicode(f.parsedstr, gothics);
        if (startline === false) {
            rv = '\\GGterm{' + rv + '}';
        }
        return rv;
    }
    // smoothbreathers
    if (operators.indexOf(f.op) >= 4) {
        if (addjudge) { rv += '\\GGjudge'; }
        // should not have a left, but in case it does
        if ((f.left) && (f.left.parsedstr != '')) {
            rv += converttogg(f.left, false, true, gothics);
        }
        rv += ' ' + handleunicode(f.op, gothics);
        // handle right; add parens if has operator
        if ((f.right) && (f.right.parsedstr != '')) {
            if (f.right.op) {
                rv += '\\left(';
            }
            rv += converttogg(f.right, false, true, gothics);
            if (f.right.op) {
                rv += '\\right)';
            }
        }
        if (startline === false) {
            rv = '\\GGterm{' + rv + '}';
        }
        return rv;
    }
    // identity
    if (f.op == '=') {
        if (addjudge) { rv += '\\GGjudge'; }
        // for everything with an operator not a smooth breathing add
        // parens
        if ((f.left) && (f.left.parsedstr != '')) {
            const addparens = (f.left.op && (operators.indexOf(f.left.op)<=3));
            if (addparens) { rv += '\\left('; };
            rv += converttogg(f.left, false, true, gothics);
            if (addparens) { rv += '\\right)'; };
        }
        rv += ' = ';
        if ((f.right) && (f.right.parsedstr != '')) {
            const addparens = (f.right.op && (operators.indexOf(f.right.op)<=3));
            if (addparens) { rv += '\\left(' ; };
            rv += converttogg(f.right, false, true, gothics);
            if (addparens) { rv += '\\right)'; };
        }
        if (startline === false) {
            rv = '\\GGterm{' + rv + '}';
        }
        return rv;
    }
    // others might start a GG portion
    if (startline) {
        rv += '{\\setlength{\\GGlinewidth}{' + formulawidth(f, addjudge).toString() +
            'pt}';
    }
    // add judgment stroke if need be
    if (addjudge) {
        rv += '\\GGjudge';
    }
    if (f.op == '¬') {
        // shouldn't be a left, but in case thereis
        if (f.left && (f.left.parsedstr != '')) {
            rv += converttogg(f.left, false, false, gothics);
        }
        rv += '\\GGnot';
        if (f.right && (f.right.parsedstr != '')) {
            rv += converttogg(f.right, false, false, gothics);
        }
    }
    if (f.op == '∀') {
        // shouldn't be a left, but in case thereis
        if (f.left && (f.left.parsedstr != '')) {
            rv += converttogg(f.left, false, false, gothics);
        }
        // use either GGquant or GGall depending on whether we
        // are using gothis
        if (gothics === false) {
            rv += '\\GGquant{'
            if (f.boundvar) {
                rv += handleunicode(f.boundvar, gothics);
            }
        } else {
            rv += '\\GGall{';
            // add bound variable to gothic swaps
            if (f.boundvar) {
                rv += f.boundvar;
            }
            if ((f.boundvar) && (gothics.indexOf(f.boundvar) == -1)) {
                gothics.push(f.boundvar);
            }
        }
        rv += '}';
        if (f.right && (f.right.parsedstr != '')) {
            rv += converttogg(f.right, false, false, gothics);
        }
    }
    if (f.op == '→') {
        rv += '\\GGconditional{';
        if (f.left && (f.left.parsedstr != '')) {
            rv += converttogg(f.left, false, false, gothics);
        }
        rv += '}{';
        if (f.right && (f.right.parsedstr != '')) {
            rv += converttogg(f.right, false, false, gothics);
        }
        rv += '}';
    }
    // end start line brackets if need be
    if (startline) {
        rv += '}';
    }
    return rv;
}

const s = normalize('ἀ(a=a) = ∀x(Fx → ¬(¬¬Gxy → ¬Fx))');
const fml = new Parse(s);

console.log('opspot is ' + fml.opspot.toString());

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

console.log(converttogg(fml, true, true, []));


