
// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

const operators = ['→','¬','=','ἀ','ἐ','ἠ','ὠ'];

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

function normalize(s) {
    return stripmatching(
        stripquantparens(
            allsoftparens(
                nospaces(s)
            )
        )
    )
}

class Parse {
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
        this._left = new Formula(leftstring);
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
            const isop = (c in operators);
            // found something at this spot
            if ((isop) && ((currdepth < mainopdepth) ||
                ((currdepth == mainopdepth) &&
                    (this.parsedstr.at(this._opspot) != '→') &&
                    (c == '→')))) {
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
        this._right = new Formula(rightstring);
        return this._right;
    }

    /*
    // determines if formula is well-formed
    get wellformed() { // should also bubble syntax errors to top
        if ("_wellformed" in this) {
            return this._wellformed;
        }
        // binary molecular
        if (Formula.syntax.isbinaryop(this.op)) {
            if (!("_wellformed" in this)) { this._wellformed = true; }
            const lresult = this.left.wellformed;
            const rresult = this.right.wellformed;
            Object.assign(this._syntaxerrors, this.left._syntaxerrors,
                this.right._syntaxerrors);
            this._wellformed = (this._wellformed && lresult && rresult);
            return this._wellformed;
        }
        // monadic operator; either quantifier or other
        if (Formula.syntax.ismonop(this.op)) {
            // assume it's all ok to start
            if (!("_wellformed" in this)) { this._wellformed = true; }
            const rresult = this.right.wellformed;
            if (!rresult) {
                this._wellformed = false;
            }
            Object.assign(this._syntaxerrors, this.right._syntaxerrors);
            const garbagebefore = (this.opspot != 0);
            if (garbagebefore) {
                this.syntaxError('unexpected character(s) appear before ' +
                    ((Formula.syntax.isquant(this.op)) ? 'a quantifier' :
                        ('the operator ' + this.op)));
                this._wellformed = false;
                // boundvar error may be misleading in case of garbage
                // so we won't wait for that
                return this._wellformed;
            }
            if (Formula.syntax.isquant(this.op)) {
                const varresult = (this.boundvar !== false);
                if (!varresult) {
                    this._wellformed = false;
                }
            }
            return this._wellformed;
        }
        // if made it here with an operator, operator should be
        // verum or falsum
        if (this.op) {
            // should consist of operator alone
            if (this.parsedstr != this.op) {
                this.syntaxError('unexpected character(s) appear ' +
                    'surrounding the symbol ' + this.op);
                this._wellformed = false;
                return this._wellformed;
            }
            // a zero-adic mainop by itself is well formed
            this._wellformed = true;
            return this._wellformed;
        }
        // should be atomic if we got here; assume OK to start
        this._wellformed = true;
        // atomic formula must have pletter
        if (this.pletter === false) {
            this._wellformed = false;
        }
        // must have terms, possibly empty
        // (I don't this this really catches anything, but forces
        // terms to be processed at least for atomics)
        if (this.terms === false) {
            this._wellformed = false;
        }
        // identity should have exactly two terms
        if (this.pletter == '=' && this.terms.length != 2) {
            this.syntaxError('uses the identity predicate “=” without ' +
                'exactly one term on each side');
        }
        // shouldn't have any errors from checking pletter and terms
        for (let prob in this._syntaxerrors) {
            this._wellformed = false;
            break;
        }
        // if got here all was OK
        return this._wellformed;
    }
*/
    /*
    // OTHER METHODS
    // important: instantiate should not change original Formula ("this")
    instantiate(variable, term) {
        if (Formula.syntax.isbinaryop(this.op)) {
            if (!this.left || !this.right) { return ''; }
            const l = Formula.from(this.left.instantiate(variable, term));
            const r = Formula.from(this.right.instantiate(variable, term));
            return l.wrapifneeded() + ' ' + this.op +
                ' ' + r.wrapifneeded();
        }
        if (Formula.syntax.ismonop(this.op)) {
            if (!this.right) { return ''; }
            // we only replace free instances, so we don't replace within
            // subformula with same variable
            if (Formula.syntax.isquant(this.op) && (this.boundvar == variable)) {
                return this.normal;
            }
            // instantiate in right side
            const r = Formula.from(this.right.instantiate(variable, term));
            // put quantifier with different variable back on right side
            if (Formula.syntax.isquant(this.op)) {
                return Formula.syntax.mkquantifier(
                    this.boundvar, this.op
                ) + r.wrapifneeded();
            }
            // monadic operator not a quantifier is just it plus right side.
            return this.op + r.wrapifneeded();
        }
        // zero place op, nothing to do
        if (this.op) { return this.normal; }
        // should be atomic
        const pletter = this.pletter ?? '';
        const terms = (this.terms ?? []).map(
            (t) => ((t == variable) ? term : t)
        );
        // too simplistic for function terms**
        let joiner = '';
        if (Formula.syntax.notation.useTermParensCommas) {
            joiner = ',';
        }
        let termstr = terms.join(joiner);
        if ((Formula.syntax.notation.useTermParensCommas)
            && (terms.length > 0)) {
            termstr = '(' + termstr + ')';
        }
        let atomicstr = pletter + termstr;
        // identity is different
        if (terms.length == 2 && pletter == '=') {
            atomicstr = terms[0] + ' = ' + terms[1];
        }
        return atomicstr;
    }

    // here fget and fstart are formulas
    // checks whether fget can result from fstart by replacing
    // zero or more occurrences of oldterm with newterm;
    // used for checking substitution of identicals
    static differsAtMostBy(fget, fstart, newterm, oldterm) {
        // false if one has an operator and
        // the other does not
        if ((fget.op && !fstart.op) || (fstart.op && !fget.op)) {
            return false;
        }
        // if neither is atomic
        if (fget.op && fstart.op) {
            // must have same operator
            if (fget.op != fstart.op) {
                return false;
            }
            // if the op is 0-place, being the same is sufficient
            if (Formula.syntax.ispropconst(fget.op)) {
                return true;
            }
            // quantifiers must use same variable
            if (Formula.syntax.isquant(fget.op) &&
                (fget.boundvar != fstart.boundvar)) {
                return false;
            }
            // must have compatible right sides
            if (!Formula.differsAtMostBy(fget.right, fstart.right,
                newterm, oldterm)) {
                return false;
            }
            // if monadic operators, the above is enough
            if (Formula.syntax.ismonop(fget.op)) {
                return true;
            }
            // if made it here, must be binary operator, and
            // have compatible left sides, which is also enough
            return Formula.differsAtMostBy(fget.left, fstart.left,
                newterm, oldterm);
        }
        // must be atomic if made it here
        // have to have same predicate
        if (fget.pletter != fstart.pletter) { return false; }
        // move on to terms, first check same length
        if (fget.terms.length != fstart.terms.length) {
            return false;
        }
        // check each term
        for (let i=0; i < fget.terms.length; i++) {
            const fgetterm = fget.terms[i];
            const fstartterm = fstart.terms[i];
            // check differently if it's the one we can substitute for
            // always OK for them to be the same
            if (fgetterm == fstartterm) { continue; }
            // if we made it here, they're different, which is only
            // allowed when it's the term we're substituting for
            if (fstartterm != oldterm) {
                return false;
            }
            // since they're different, the new one must be the
            // replacement
            if (fgetterm != newterm) {
                return false;
            }
            // getting here is OK, move on to check next
        }
        // atomics are same except substitution, which is OK
        return true;
    }

    // function for checking if something is an instance
    // of a qauntified formula
    static isInstanceOf(i, f) {
        // formula must apply the quantifier to something
        if (!f.right) { return false; }
        // filter to terms that are not variables
        let tt = i.terms;
        tt = tt.filter((t) => (!Formula.syntax.isvar(t)));
        // see if instance can be got by replacing the formula's
        // bound variable with that term
        for (let c of tt) {
            if (i.normal == f.right.instantiate(f.boundvar, c)) {
                return true;
            }
        }
        // fell through so it is not an instance
        return false;
    }

    // adds a syntax error to the collection of errors
    syntaxError(reason) {
        this._syntaxerrors[reason] = true;
        this._wellformed = false;
    }

    // puts parentheses around formulae with binary operators
    wrapifneeded() {
        if (this.op && Formula.syntax.isbinaryop(this.op)) {
            return this.wrapit();
        }
        return this.normal;
    }

    // puts parentheses around anything, picking nice ones based
    // on its depth
    wrapit() {
        switch (this.depth % 3) {
            case 0:
                return '{' + this.normal + '}';
                break;
            case 1:
                return '(' + this.normal + ')';
                break;
            case 2:
                return '[' + this.normal + ']';
                break;
            default: // shouldn't be here
                return this.normal;
        }
        return this.normal; // shouldn't be here either
    }
    */
}


