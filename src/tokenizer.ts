export enum Token {
  openParenthesis,
  closeParenthesis,
  plus,
  minus,
  equals,
  equals_equals,
  lessThan,
  greaterThan,
  number,
  sprite,
  loc,
  func,
  forever,
  stringLiteral,
  openBracket,
  closeBracket,
  openBrace,
  closeBrace,
  identifier,
  semicolon,
  ret,
  this,
  period,
  times,
  repeat,
  divide,
  if,
  exclamation,
  else,
  comma,
  let,
  list,
  or,
  and,
  tilde,
}

let identifierCharacter = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
identifierCharacter = identifierCharacter.concat(
  identifierCharacter.map((e) => e.toUpperCase())
);
const numericCharacter = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
export class Tokenizer {
  string: string;
  position: number = 0;
  identifier: string = "";
  number: string = "";
  stringLiteral: string = "";
  constructor(s: string) {
    this.string = s;
  }
  seeToken(): Token {
    let f = this.position;
    let r = this.getToken();
    this.position = f;
    return r;
  }
  getToken(): Token {
    while ([" ", "\n"].includes(this.string.charAt(this.position)))
      this.position++;

    if (this.ifNextAdvance("(")) return Token.openParenthesis;
    if (this.ifNextAdvance(")")) return Token.closeParenthesis;
    if (this.ifNextAdvance("~")) return Token.tilde;
    if (this.ifNextAdvance("<")) return Token.lessThan;
    if (this.ifNextAdvance(">")) return Token.greaterThan;
    if (this.ifNextAdvance("+")) return Token.plus;
    if (this.ifNextAdvance("-")) return Token.minus;
    if (this.ifNextAdvance("{")) return Token.openBracket;
    if (this.ifNextAdvance("|")) return Token.or;
    if (this.ifNextAdvance("&&")) return Token.and;
    if (this.ifNextAdvance("}")) return Token.closeBracket;
    if (this.ifNextAdvance("[")) return Token.openBrace;
    if (this.ifNextAdvance("]")) return Token.closeBrace;
    if (this.ifNextAdvance(";")) return Token.semicolon;
    if (this.ifNextAdvance("==")) return Token.equals_equals;
    if (this.ifNextAdvance("=")) return Token.equals;
    if (this.ifNextAdvance(".")) return Token.period;
    if (this.ifNextAdvance("*")) return Token.times;
    if (this.ifNextAdvance(",")) return Token.comma;
    if (this.ifNextAdvance("//")) {
      while (this.string.charAt(this.position) != "\n") this.position++;
      return this.getToken();
    }
    if (this.ifNextAdvance("/")) return Token.divide;

    if (this.ifNextAdvance("if")) return Token.if;
    if (this.ifNextAdvance("else")) return Token.else;
    if (this.ifNextAdvance("!")) return Token.exclamation;

    let newStr = "";
    while (true && this.position < this.string.length) {
      if (
        (newStr.length != 0
          ? numericCharacter.includes(this.string.charAt(this.position))
          : false) ||
        identifierCharacter.includes(this.string.charAt(this.position))
      ) {
        newStr += this.string.charAt(this.position);
        this.position++;
      } else {
        break;
      }
    }
    switch (newStr) {
      case "sprite":
        return Token.sprite;
      case "forever":
        return Token.forever;
      case "loc":
        return Token.loc;
      case "func":
        return Token.func;
      case "repeat":
        return Token.repeat;
      case "ret":
        return Token.ret;
      case "this":
        return Token.this;
      case "let":
        return Token.let;
      case "list":
        return Token.list;
      default:
        if (newStr.length > 0) {
          this.identifier = newStr;
          return Token.identifier;
        }
    }

    if (this.ifNextAdvance(`"`)) {
      let newStr = "";
      while (this.position < this.string.length) {
        if ('"' != this.string.charAt(this.position)) {
          newStr += this.string.charAt(this.position);
          this.position++;
        } else {
          this.position++;
          break;
        }
      }
      //   console.log(newStr);

      this.stringLiteral = newStr;
      return Token.stringLiteral;
    }
    let newNum = "";
    let gotPeriod = false;
    while (true && this.position < this.string.length) {
      if (numericCharacter.includes(this.string.charAt(this.position))) {
        newNum += this.string.charAt(this.position);
        this.position++;
      } else if (this.string.charAt(this.position) == "." && !gotPeriod) {
        gotPeriod = true;
        newNum += ".";
        this.position++;
      } else {
        break;
      }
    }

    if (newNum.length > 0) {
      this.number = newNum;
      return Token.number;
    } else {
      throw new Error(
        "Unknown token: `" +
          this.string.slice(this.position, this.position + 10) +
          "`"
      );
    }
  }

  isNext(r: string): boolean {
    return this.string.slice(this.position, this.position + r.length) == r;
  }
  ifNextAdvance(r: string): boolean {
    if (this.isNext(r)) {
      this.position += r.length;
      return true;
    } else {
      return false;
    }
  }

  skipToTokEnd() {}
}
