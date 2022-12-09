// import { specifier } from './util.js';
import reserved from '../util/reserved.js';

let _stream = [];
let _prev;

/**
 * return whether a value is equal to one of multiple passed values
 * @param {*} value the value to check
 * @param {*[]} values array of valid values
 */
export function any (value, values) {
  return values.includes(value);
}

/**
 * @param {*} value
 */
export function defined (value) {
  return value !== undefined;
}

/**
 * return whether one value is equal to another
 * @param {*} v1
 * @param {*} v2
 */
export function equal (v1, v2) {
  return v1 === v2;
}

/**
 * return whether a value matches a regular expression
 * @param {*} value
 * @param {RegExp} regexp
 */
export function matches (value, regexp) {
  return typeof value === 'string' && value.match(regexp) !== null;
}

/**
 * return the type of a value
 * works with Tokens and with primitive values
 * @param {*} v
 * @param {Object} [options]
 * @param {boolean} [options.srm]
 *   whether to return the type 'mutable' for unknown strings
 */
export function typeOf (v, options = {}) {
  let value = v; // true value to work with
  if (v instanceof Token.Token) {
    value = value.value; // haha...
  }
  if (value === undefined) {
    return 'none';
  } else if (reserved.includes(value)) {
    return 'reserved';
  } else if (typeof value === 'number' ||
    (typeof value === 'string' && value !== '' && !isNaN(Number(value)))
  ) {
    return 'number';
  } else if (matches(/^'.*'$/, value)) {
    return 'string';
  } else if (typeof value === 'string') {
    if (options.srm) {
      return 'mutable';
    }
    return 'string';
  } else {
    return 'other';
  }
}

/**
 * cast a value to a primitive JavaScript type
 * does not mutate the original value
 * @param {*} v
 * @returns {number|string}
 */
// TODO: automatic and manual
export function cast (v) {
  let value = v; // true value to work with
  if (v instanceof Token.Token) {
    value = value.value; // haha...
  }
  const T = typeOf(value);
  if (T === 'number') {
    return Number(value);
  }
  if (T === 'string') {
    value = value.replace(/\\n/g, '\n');
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1); // remove
    }
  }
  return value;
}

/**
 * return the format specifier that matches a token value
 * supported specifiers include:
 *   %n  number
 *   %s  string
 *   %r  reserved word
 *   %m  mutable
 *       (understood to be some other unqualified word)
 *   %a  any
 * @param {*} value
 */
function specifier (value) {
  const T = typeOf(value, { srm: true });
  // console.log(value, T);
  if (T === 'number') {
    return '%n';
  }
  if (T === 'string') {
    return '%s';
  }
  if (T === 'reserved') {
    return '%r';
  }
  if (T === 'mutable') {
    return '%m';
  }
  return '%a';
}

// default object
// import with the name Token
const Token = {
  /**
   * class representing a token
   */
  Token: class Token {
    /**
     * @param {*} value
     */
    constructor (value) {
      this.value = value;
      this.specifier = specifier(value);
    }
  },
  assertAny (value, values) {
    if (!any(value, values)) {
      throw new CloverError(
        'expected one of %t, got %t instead', values, value
      );
    }
    return this;
  },
  assertDefined (value) {
    if (!defined(value)) {
      throw new CloverError("expected a token, but didn't get one");
    }
  },
  assertEqual (v1, v2) {
    if (!equal(v1, v2)) {
      throw new CloverError(
        'expected token %t, got %t instead', v1, v2
      );
    }
    return this;
  },
  assertMatches (value, regexp) {
    if (!matches(value, regexp)) {
      throw new CloverError('token %t does not match regex', value);
    }
    return this;
  },
  assertType (value, T) {
    const t = typeOf(value, { srm: true });
    if (t !== T) {
      throw new CloverError(
        'expected token of type %s, got %s instead', T, t
      );
    }
    return this;
  },
  /**
   * syntactic sugar for `next()`
   * chainable
   */
  drop (count = 1) {
    for (let i = 0; i < count; i++) {
      this.next();
    }
    return this;
  },
  /**
   * return whether the current token stream is empty
   * getter
   */
  get empty () {
    return this.stream.length === 0;
  },
  /**
   * return the first remaining element of the current token stream
   * getter
   */
  get head () {
    return this.stream[0];
  },
  /**
   * move on to the next token of the current token stream
   * chainable
   */
  next () {
    _prev = this.stream.shift();
    return this;
  },
  get prev () {
    return _prev;
  },
  /**
   * return what remains of the current token stream
   * getter
   */
  get stream () {
    return _stream;
  },
  /**
   * set the current token stream
   * setter
   * @param {*[]} s
   */
  set stream (s) {
    _stream = s;
  },
  /**
   * syntactic sugar for `next()`
   * chainable
   */
  then () {
    this.next();
    return this;
  }
};

export default Token;
