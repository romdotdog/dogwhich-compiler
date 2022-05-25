import {
  Block,
  ItemOfList,
  List,
  Literal,
  LiteralNumber,
  Reporter,
} from "../scratch";
import { BinaryExpression, Expression } from "../parser";
import { reporter } from "../scratch/structure";
const Locals = new List("locals");

export function ToIr(e: Expression) {}


interface IRexpression {
  isPure: boolean;
  get(): {
    blocks: Block[];
    reporter: Reporter | Literal;
  };
}

function r(e: IRexpression) {
  if (e.get()) {
  }
}

interface Variable {
  get(): IRexpression;

  set(value: Reporter | Literal): IRexpression;
}

class LocalVariable {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class BlockAllocation {
  parent?: BlockAllocation;
  variables: LocalVariable[] = [];
  constructor(variables: LocalVariable[], parent?: BlockAllocation) {
    this.variables = variables;
    this.parent = parent;
  }
  getIndexForVar(name: string): number {
    let variable = this.variables.findIndex((r) => r.name == name);
    if (variable != -1) {
      return variable + 1;
    } else if (this.parent) {
      return this.parent.getIndexForVar(name) + this.variables.length;
    } else {
      throw new Error(`Local variable ${name} not found in scope.`);
    }
  }
  getItem(name: string) {
    return Locals.getItemAt(new LiteralNumber(this.getIndexForVar(name)));
  }
}

/**
 * let outer = 4;
 * let outer2 =3;
 * if(true){
 * let inner =5;
 * }
 */
let outerScope = new BlockAllocation([
  new LocalVariable("outer"),
  new LocalVariable("outer2"),
]);

let innerScope = new BlockAllocation([new LocalVariable("inner")], outerScope);

console.log(innerScope.getIndexForVar("inner"));

// class ControlSegment {
//   vars: LocalVariable[] = [];
//   alloc(n: number) {}
// }

// namespace IR {
//   class Function {}
// }

// abstract class StackElement {
//   static p = 3;
//   static {}
//   static static: number | typeof StackElement.p = 3;
// }
