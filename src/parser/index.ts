import assert from "assert";
import { IfElse, Reporter } from "../scratch";
import { Token, Tokenizer } from "../tokenizer";

export interface Node {}

export interface Expression extends Node {}

export class NumericExpression implements Expression {
  constructor(public value: string) {}
}
export class StringExpression implements Expression {
  constructor(public value: string) {}
}

export class IfStatement implements Statement {
  constructor(public condition: Expression, public iftrue: Statement[]) {}
}
export class ForeverStatemenet implements Statement {
  constructor(public statements: Statement[]) {}
}
export class RepeatStatement implements Statement {
  constructor(public times: Expression, public statements: Statement[]) {}
}
export class IfElseStatement implements Statement {
  constructor(
    public condition: Expression,
    public iftrue: Statement[],
    public ifalse: Statement[]
  ) {}
}

export class ReturnStatement implements Statement {
  constructor(public returns?: Expression) {}
}
export class PropertyAccessExpression implements Expression {
  constructor(public left: Expression, public right: Expression) {}
}
export interface Statement extends Node {}

export class LetStatement implements Statement {
  constructor(public name: string, public initializer: Expression) {}
}
export class IdentifierExpression implements Expression {
  constructor(public value: string) {}
}

export class ThisExpression implements Expression {
  constructor() {}
}

export class FieldDeclaration implements Node {
  name: string;
  constructor(name: string, public list: boolean = false) {
    this.name = name;
  }
}

export class ArrayAccessExpression implements Expression {
  constructor(public accessing: Expression, public index: Expression) {}
}
export class AssignmentExpression implements Expression {
  constructor(public left: Expression, public right: Expression) {}
}

export enum BinaryExpressionType {
  plus,
  minus,
  times,
  equals_equals,
  less_than,
  or,
  and,
  greater_than,
  divide,
  join,
}
export class FunctionCallExpression implements Expression {
  constructor(public calling: Expression, public parameters: Expression[]) {}
}
export class BinaryExpression implements Expression {
  constructor(
    public left: Expression,
    public right: Expression,
    public type: BinaryExpressionType
  ) {}
}
export enum UnaryExpressionType {
  not,
  negative,
}
export class UnaryExpression implements Expression {
  constructor(
    public expression: Expression,
    public type: UnaryExpressionType
  ) {}
}

export class FunctionDeclaration implements Node {
  name: string;
  statements: Statement[];
  parameters: IdentifierExpression[];
  constructor(
    name: string,
    statements: Statement[] = [],
    parameters: IdentifierExpression[] = []
  ) {
    this.name = name;
    this.statements = statements;
    this.parameters = parameters;
  }
}
export class ExpressionStatement implements Statement {
  constructor(public expression: Expression) {}
}
export class SpriteDeclaration implements Node {
  constructor(
    public name: string,
    public fields: FieldDeclaration[],
    public functions: FunctionDeclaration[]
  ) {}
}
export class Parser {
  tokenizer: Tokenizer;
  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
  }
  parseTopLevelStatement() {
    let tok;
    switch ((tok = this.tokenizer.seeToken())) {
      case Token.sprite:
        return this.parseSpriteDefinition();
        break;
      default:
        throw new Error(`Unexpected ${Token[tok]}...`);
        break;
    }
  }

  parseSpriteDefinition() {
    /** Check for 'sprite' keyword: */
    if (this.tokenizer.getToken() != Token.sprite)
      throw new Error("ERROR: KEYWORD IS NOT SPRITE");
    this.assert(
      this.tokenizer.getToken() == Token.identifier,
      "sprite must be followed by identifier"
    );
    let name = this.tokenizer.identifier;
    this.assert(
      this.tokenizer.getToken() == Token.openBracket,
      "sprite name must be followed by opening bracket"
    );
    let internalStatements = [];
    let fields: FieldDeclaration[] = [];
    let functions: FunctionDeclaration[] = [];
    while (this.tokenizer.seeToken() != Token.closeBracket) {
      let m = this.parseSpriteStatement();

      if (m instanceof FieldDeclaration) fields.push(m);
      else if (m instanceof FunctionDeclaration) functions.push(m);
      else this.assert(false, "Unreachable");
    }
    // console.log(
    //   this.tokenizer.string.slice(
    //     this.tokenizer.position - 10,
    //     this.tokenizer.position + 10
    //   )
    // );
    this.assert(
      this.tokenizer.getToken() == Token.closeBracket,
      "Sprite definititon must be followed by closing bracket"
    );
    this.assert(
      this.tokenizer.getToken() == Token.semicolon,
      "Sprite definition must be followed by semicolon"
    );

    return new SpriteDeclaration(name, fields, functions);
  }

  assert(value: boolean, reason: string) {
    if (!value)
      throw new Error(
        `Assertation failed: ${reason} @${this.tokenizer.string.slice(
          this.tokenizer.position - 5,
          this.tokenizer.position + 10
        )}`
      );
  }

  parseSpriteStatement(): Statement {
    switch (this.tokenizer.seeToken()) {
      case Token.loc:
        this.tokenizer.getToken();
        let isList =
          this.tokenizer.seeToken() == Token.list
            ? (this.tokenizer.getToken(), true)
            : false;
        this.assert(
          this.tokenizer.getToken() == Token.identifier,
          "Local parameter declaration must be followed by identifier"
        );
        let name = this.tokenizer.identifier;
        this.assert(
          this.tokenizer.getToken() == Token.semicolon,
          "Statements must be followed by semicolons"
        );
        return new FieldDeclaration(name, isList);
        break;
      case Token.func:
        this.tokenizer.getToken();
        this.assert(
          this.tokenizer.getToken() == Token.identifier,
          "Function declaration must be followed by identifier"
        );
        let fname = this.tokenizer.identifier;
        this.assert(
          this.tokenizer.getToken() == Token.openParenthesis,
          "Function  declarations must have ()"
        );
        let params: IdentifierExpression[] = [];
        if (this.tokenizer.seeToken() == Token.identifier) {
          while (this.tokenizer.seeToken() != Token.closeParenthesis) {
            if (this.tokenizer.getToken() == Token.identifier) {
              let ident = new IdentifierExpression(this.tokenizer.identifier);
              params.push(ident);
              if (this.tokenizer.seeToken() == Token.closeParenthesis) break;
              if (this.tokenizer.getToken() != Token.comma)
                throw new Error("Parameters must be seperated by commas.");
            } else
              throw new Error("ERROR:  parameter was not identifier token.");
          }
        }
        this.assert(
          this.tokenizer.getToken() == Token.closeParenthesis,
          "Function  declarations must have ()"
        );
        this.assert(
          this.tokenizer.getToken() == Token.openBracket,
          "Function  declarations must have { after ()"
        );
        let fnStatements: Statement[] = [];

        while (this.tokenizer.seeToken() != Token.closeBracket) {
          fnStatements.push(this.parseFunctionStatement());
        }
        this.tokenizer.getToken();
        return new FunctionDeclaration(fname, fnStatements, params);
        break;

      default:
        throw new Error(
          "ERROR: UNEXPECTED TOKEN : " + Token[this.tokenizer.seeToken()]
        );
        break;
    }
  }
  parseForeverStatement(): Statement {
    this.assert(
      this.tokenizer.getToken() == Token.forever,
      " forever must be started by forever... [compiler logic error]"
    );

    this.assert(
      this.tokenizer.getToken() == Token.openBracket,
      " Forever must be followed by block"
    );
    let istatements: Statement[] = [];

    while (this.tokenizer.seeToken() != Token.closeBracket) {
      istatements.push(this.parseFunctionStatement());
    }

    this.tokenizer.getToken();
    return new ForeverStatemenet(istatements);
  }
  parseIfStatement(): Statement {
    this.assert(
      this.tokenizer.getToken() == Token.if,
      " If must be started by if... [compiler logic error]"
    );
    this.assert(
      this.tokenizer.getToken() == Token.openParenthesis,
      " If must be followed by parenthesis"
    );
    let cond = this.parseExpression();
    this.assert(
      this.tokenizer.getToken() == Token.closeParenthesis,
      " If must be followed by parenthesis"
    );
    this.assert(
      this.tokenizer.getToken() == Token.openBracket,
      " If must be followed by block"
    );
    let istatements: Statement[] = [];

    while (this.tokenizer.seeToken() != Token.closeBracket) {
      istatements.push(this.parseFunctionStatement());
    }

    this.tokenizer.getToken();

    // console.log(Token[this.tokenizer.seeToken()]);
    // console.log(Token[this.tokenizer.seeToken()]);

    if (this.tokenizer.seeToken() == Token.else) {
      this.tokenizer.getToken();
      switch (this.tokenizer.seeToken()) {
        case Token.openBracket:
          this.tokenizer.getToken();
          let ielse: Statement[] = [];

          while (this.tokenizer.seeToken() != Token.closeBracket) {
            ielse.push(this.parseFunctionStatement());
          }
          this.tokenizer.getToken();
          return new IfElseStatement(cond, istatements, ielse);
          break;

        case Token.if:
          // this.tokenizer.getToken();
          return new IfElseStatement(cond, istatements, [
            this.parseIfStatement(),
          ]);
          break;
        default:
          throw new Error("Else must be followed by a `{` or a `if` token");

          break;
      }
    } else {
      return new IfStatement(cond, istatements);
    }
  }
  parseFunctionStatement(): Statement {
    switch (this.tokenizer.seeToken()) {
      case Token.ret:
        this.tokenizer.getToken();
        if (this.tokenizer.seeToken() == Token.semicolon) {
          this.tokenizer.getToken();
          return new ReturnStatement();
        } else {
          let expr = this.parseExpression();
          this.assert(
            this.tokenizer.getToken() == Token.semicolon,
            " ret statements must be followed by semicolon"
          );
          return new ReturnStatement(expr);
        }

        break;
      case Token.repeat:
        this.tokenizer.getToken();
        this.assert(
          this.tokenizer.getToken() == Token.openParenthesis,
          "Repeat must be followed by ("
        );
        let expr = this.parseExpression();
        this.assert(
          this.tokenizer.getToken() == Token.closeParenthesis,
          "Repeat must be followed by )"
        );
        this.assert(
          this.tokenizer.getToken() == Token.openBracket,
          "Repeat must be followed by {"
        );
        let statements: Statement[] = [];

        while (this.tokenizer.seeToken() != Token.closeBracket) {
          statements.push(this.parseFunctionStatement());
        }
        this.assert(
          this.tokenizer.getToken() == Token.closeBracket,
          "Repeat must be followed by }"
        );
        return new RepeatStatement(expr, statements);

        break;
      case Token.let:
        this.tokenizer.getToken();
        assert(
          this.tokenizer.getToken() == Token.identifier,
          "'let' must be followed by identifier."
        );
        let name = this.tokenizer.identifier;
        assert(
          this.tokenizer.getToken() == Token.equals,
          "Let `identifier` must be followed by equal"
        );
        let initializer = this.parseExpression();
        this.assert(
          this.tokenizer.getToken() == Token.semicolon,
          " let statements must be followed by semicolon"
        );
        return new LetStatement(name, initializer);
        break;
      case Token.if:
        // this.tokenizer.getToken();
        let m = this.parseIfStatement();
        console.log(Token[this.tokenizer.seeToken()]);
        return m;
        break;
      case Token.forever:
        return this.parseForeverStatement();
        break;
      default:
        let f = this.parseExpression();

        this.assert(
          this.tokenizer.getToken() == Token.semicolon,
          " expression statements must be followed by semicolon"
        );
        return new ExpressionStatement(f);

        break;
    }
  }

  parseExpression(): Expression {
    let _expr = this.parseExpressionSimple();
    Mloop: while (true) {
      switch (this.tokenizer.seeToken()) {
        case Token.openBrace:
          this.tokenizer.getToken();
          let expr = this.parseExpression();
          this.assert(
            this.tokenizer.getToken() == Token.closeBrace,
            "Array acess must be closed"
          );
          _expr = new ArrayAccessExpression(_expr, expr);
          break;
        case Token.openParenthesis:
          this.tokenizer.getToken();
          if (this.tokenizer.seeToken() == Token.closeParenthesis) {
            this.tokenizer.getToken();
            _expr = new FunctionCallExpression(_expr, []);
          } else {
            let params = [];

            while (this.tokenizer.seeToken() != Token.closeParenthesis) {
              params.push(this.parseExpression());

              if (this.tokenizer.seeToken() == Token.comma)
                this.tokenizer.getToken();
            }
            this.tokenizer.getToken();

            _expr = new FunctionCallExpression(_expr, params);
          }

          break;
        case Token.equals:
          this.tokenizer.getToken();
          _expr = new AssignmentExpression(_expr, this.parseExpression());
          break;

        case Token.equals_equals:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.equals_equals
          );
          break;
        case Token.or:
          this.tokenizer.getToken();

          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.or
          );

          break;
        case Token.and:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.and
          );
          break;
        case Token.lessThan:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.less_than
          );
          break;
        case Token.greaterThan:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.greater_than
          );
          break;
        case Token.plus:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.plus
          );

          break;
        case Token.tilde:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.join
          );

          break;
        case Token.minus:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.minus
          );

          break;
        case Token.times:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.times
          );
          break;
        case Token.divide:
          this.tokenizer.getToken();
          _expr = new BinaryExpression(
            _expr,
            this.parseExpression(),
            BinaryExpressionType.divide
          );
          break;
        case Token.period:
          this.tokenizer.getToken();
          let right = this.parseIdentifier();
          _expr = new PropertyAccessExpression(_expr, right);
          break;
        default:
          break Mloop;
      }
    }
    return _expr;
  }
  parseIdentifier() {
    this.assert(
      this.tokenizer.getToken() == Token.identifier,
      "Must be identifier"
    );
    return new IdentifierExpression(this.tokenizer.identifier);
  }
  /** No extensions/binary operators (=/+)
   * unary operators are here
   */
  parseExpressionSimple(): Expression {
    let tok = this.tokenizer.getToken();
    switch (tok) {
      case Token.stringLiteral:
        return new StringExpression(this.tokenizer.stringLiteral);
        break;
      case Token.openParenthesis:
        let tr = this.parseExpression();

        this.assert(
          this.tokenizer.getToken() == Token.closeParenthesis,
          "Parenthesis must be closed..."
        );
        return tr;
        break;
      case Token.number:
        return new NumericExpression(this.tokenizer.number);
      case Token.this:
        return new ThisExpression();
        break;
      case Token.identifier:
        return new IdentifierExpression(this.tokenizer.identifier);
        break;
      case Token.exclamation:
        let expr = this.parseExpressionSimple();
        return new UnaryExpression(expr, UnaryExpressionType.not);
        break;
      case Token.minus:
        let _expr = this.parseExpression();
        if (_expr instanceof NumericExpression)
          return (_expr.value = "-" + _expr.value), _expr;
        return new UnaryExpression(_expr, UnaryExpressionType.negative);
        break;
      default:
        throw new Error(
          "ERROR: Unexpected " + Token[tok] + " when parsing expression"
        );
        break;
    }
  }
}
