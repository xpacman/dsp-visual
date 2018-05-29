/**
 * Created by paco on 28.5.18.
 */

/**
 * Class representing polynomial, supports multiplication
 */
export default class Poly {

  constructor(coeff) {
    this.coeff = !(coeff instanceof Array) ? Array.prototype.slice.call(arguments) : coeff;
    this.length = this.coeff.length;
    this.multiply = function (poly) {
      if (!poly) return this;

      const totalLength = this.coeff.length + poly.coeff.length - 1,
        result = new Array(totalLength);

      for (let i = 0; i < result.length; i++)
        result[i] = 0;

      for (let i = 0; i < this.coeff.length; i++) {
        for (let j = 0; j < poly.coeff.length; j++) {
          result[i + j] += this.coeff[i] * poly.coeff[j];
        }
      }
      return new Poly(result);
    }
  }

  /**
   * Will make binomials from arguments and multiplies them recursively
   * @return {undefined}
   */
  static multiply() {
    let args = Array.prototype.slice.call(arguments),
      result = undefined;

    for (let i = 0; i < args.length; i++) {
      if (!(args[i] instanceof Poly))
        args[i] = new Poly(args[i]);

      result = args[i].multiply(result);
    }
    return result;
  };

  /**
   * Solves polynomial for x value
   * @param x number X value to solve polynomial for
   * @return {number}
   */
  solve(x) {
    let ret = 0;

    for (let i = 0; i < this.coeff.length; i++) {
      if (this.coeff[i] instanceof Poly) {
        ret += this.coeff[i].solve(x)
      } else {
        ret += this.coeff[i] * Math.pow(x, i);
      }
    }
    return ret;
  }

  /**
   * Will return string interpretation of polynomial in final form
   * @unicode boolean if true, will use unicode characters as superscripts instead of <sup>
   * @return {string}
   */
  toString(unicode = false) {
    let multiStr = [];
    for (let i = this.coeff.length - 1; i >= 0; i--) {
      for (let j = this.coeff[i].length - 1; j >= 0; j--) {
        if (!multiStr[j]) {
          multiStr[j * 2] = 0;
          multiStr[j * 2 + 1] = ( (j !== 0 ? " x" : "") + (j !== 1 && j !== 0 ? `${unicode ? `${Poly.superScript(j)}` : `${`<sup>` + j + `</sup>`}`}` : "") ) + " +";
        }
        multiStr[j * 2] += this.coeff[i].coeff[j];
      }
    }

    for (let i = multiStr.length - 2; i >= 0; i -= 2) {
      multiStr[i] = parseFloat(multiStr[i].toFixed(7));
      if (multiStr[i + 2] < 0 || !multiStr[i + 2])
        multiStr[i + 1] = multiStr[i + 1].replace(/\+\s?$/, '');
    }

    return multiStr.join('').replace(/([\-\+])/g, ' $1 ')
  }

  /**
   * Will return number subscript as unicode character
   */
  static subScript(number) {
    if (number < 0 || number > 9) {
      return null;
    }
    const subscripts = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
    return subscripts[number];
  }

  /**
   * Will return number superscript as unicode character
   */
  static superScript(number) {
    if (number < 0 || number > 9) {
      return null;
    }
    const superScripts = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
    return superScripts[number];
  }
}
