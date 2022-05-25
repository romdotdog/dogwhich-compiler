import { generateScratchId } from "./util";
import { Project } from "./loader";
import {
  flagClickedBlock,
  input,
  blockAsArray,
  operator,
  procedures,
  reporter,
  scratchBlock,
  scratchId,
  spriteBase,
  scratchStage,
  scratchSprite,
  setVariableTo,
  inputVar,
  control,
  data,
  motion,
  looks,
  sensing,
  pen,
} from "./structure";
import { saveProject } from "./zipping";

interface Compilable<T> {
  Compile(sprite: spriteBase): T;
}
type CompiledBlock = { id: string; block: scratchBlock };
type CompiledReporter<T extends reporter = reporter> = {
  id: string;
  reporter: T;
};

type CompiledShadow = { value: blockAsArray };
/**
 * Function to take value of type inputShadow or Reporter and return the correct input.
 */
export function sToInput(
  f: blockAsArray | CompiledReporter,
  id: string
): input {
  if ("id" in f) {
    f.reporter.parent = id;
    return [2, f.id];
  } else {
    return [1, f];
  }
}

const simpleBlock = <
  selectedBlock extends pen.clear | pen.penDown | pen.penUp | pen.stamp
>(
  r: selectedBlock["opcode"]
) =>
  class implements Block {
    Compile(s: spriteBase) {
      const id = generateScratchId();
      //@ts-ignore
      const blck: selectedBlock = {
        opcode: r,
        inputs: {},
        fields: {},
        next: null,
        parent: null,
        shadow: false,
        topLevel: false,
      };
      s.blocks[id] = blck;
      return { id, block: blck };
    }
  };

export namespace Pen {
  export const Stamp = simpleBlock("pen_stamp");
  export const Clear = simpleBlock("pen_clear");
  export const PenUp = simpleBlock("pen_penUp");
  export const PenDown = simpleBlock("pen_penDown");
  export class SetSize implements Block {
    constructor(public size: Literal | Reporter) {}
    Compile(s: scratchSprite): CompiledBlock {
      let id = generateScratchId();
      let rv = this.size.Compile(s);
      let m = sToInput(rv, id);

      let r: pen.setPenSizeTo = {
        shadow: false,
        opcode: "pen_setPenSizeTo",
        parent: null,
        next: null,
        topLevel: false,
        inputs: { SIZE: m },
        fields: {},
      };
      s.blocks[id] = r;
      return { id, block: r };
    }
  }
}
/** Function to compile a list of Blocks */
function compileBlocks(blocks: Block[], s: spriteBase) {
  if (blocks.length == 0) return null;
  let first = blocks[0].Compile(s);

  let prev: CompiledBlock = first;
  for (const r of blocks.slice(1)) {
    let m = r.Compile(s);
    prev.block.next = m.id;
    m.block.parent = prev.id;
    prev = m;
  }
  return first;
}
export type Literal = Compilable<blockAsArray>;
export type Block = Compilable<CompiledBlock>;
export type Reporter<T extends reporter = reporter> = Compilable<
  CompiledReporter<T>
>;
export class LiteralString implements Literal {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
  Compile(): [10, string] {
    return [10, this.value];
  }
}
export class LiteralNumber implements Literal {
  value: `${number}`;
  constructor(value: number) {
    this.value = `${value}`;
  }
  Compile(): [4, `${number}`] {
    return [4, this.value];
  }
}

export class MultipleBlocks implements Block {
  constructor(public blocks: Block[]) {
    if (blocks.length == 0)
      throw new Error(
        "ERROR: MUST PASS IN AT LEAST ONE BLOCK INTO MultipleBlocks CONSTRUCTOR"
      );
  }
  Compile(s: spriteBase): CompiledBlock {
    let first = this.blocks[0].Compile(s);

    let prev: CompiledBlock = first;
    for (const r of this.blocks.slice(1)) {
      let m = r.Compile(s);
      prev.block.next = m.id;
      m.block.parent = prev.id;
      prev = m;
    }

    return {
      id: prev.id,
      //@ts-ignore
      block: {
        ...prev.block,
        get parent() {
          return first.block.parent;
        },
        set parent(e: string | null) {
          first.block.parent = e;
        },
        get next() {
          return prev.block.next;
        },
        set next(e: string | null) {
          prev.block.next = e;
        },
      },
    };
  }
}
export class Repeat implements Block {
  constructor(public times: Literal | Reporter, public blocks: Block[]) {}
  Compile(s: spriteBase) {
    const id = generateScratchId();
    let times = this.times.Compile(s);
    let ttimes = sToInput(times, id);
    let iftrue = compileBlocks(this.blocks, s);
    if (iftrue) iftrue.block.parent = id;

    let itrue = iftrue?.id ?? null;
    const ev: control.repeatBlock = {
      opcode: "control_repeat",
      next: null,
      parent: null,
      inputs: {
        SUBSTACK: [2, itrue],
        TIMES: ttimes,
      },
      fields: {},
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = ev;
    return { id, block: ev };
  }
}
export class Forever implements Block {
  constructor(public blocks: Block[]) {}
  Compile(s: spriteBase) {
    const id = generateScratchId();

    let iftrue = compileBlocks(this.blocks, s);
    if (iftrue) iftrue.block.parent = id;

    let itrue = iftrue?.id ?? null;
    const ev: control.forever = {
      opcode: "control_forever",
      next: null,
      parent: null,
      inputs: {
        SUBSTACK: [2, itrue],
      },
      fields: {},
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = ev;
    return { id, block: ev };
  }
}
export class IfElse implements Block {
  ifTrue: Block[];
  ifFalse: Block[];
  condition: Reporter | Literal;
  constructor(
    condition: Reporter | Literal,
    ifTrue: Block[],
    ifFalse: Block[]
  ) {
    this.condition = condition;
    this.ifTrue = ifTrue;
    this.ifFalse = ifFalse;
  }
  Compile(s: spriteBase) {
    const id = generateScratchId();
    let cond = this.condition.Compile(s);
    let inp = sToInput(cond, id);
    let iftrue = compileBlocks(this.ifTrue, s);

    let iffalse = compileBlocks(this.ifFalse, s);
    if (iftrue) iftrue.block.parent = id;
    if (iffalse) iffalse.block.parent = id;
    let itrue = iftrue?.id ?? null;
    let ifalse = iffalse?.id ?? null;

    const ev: control.control_if_else = {
      opcode: "control_if_else",
      next: null,
      parent: null,
      inputs: {
        CONDITION: inp,
        SUBSTACK: [2, itrue],
        SUBSTACK2: [2, ifalse],
      },
      fields: {},
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = ev;
    return { id, block: ev };
  }
}
export class WhenFlagClicked implements Block {
  statements: Block[];
  constructor(statements: Block[]) {
    this.statements = statements;
  }
  Compile(sprite: spriteBase) {
    const id = generateScratchId();
    const ev: flagClickedBlock = {
      opcode: "event_whenflagclicked",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: true,
      x: 0,
      y: 0,
    };
    let prev: CompiledBlock = { id: id, block: ev };
    for (const r of this.statements) {
      let m = r.Compile(sprite);
      prev.block.next = m.id;
      m.block.parent = prev.id;
      prev = m;
    }
    sprite.blocks[id] = ev;
    return { id, block: ev };
  }
}
export class Join implements Reporter<operator.operator_join> {
  constructor(
    public left: Literal | Reporter,
    public right: Literal | Reporter
  ) {}
  Compile(s: spriteBase) {
    let id = generateScratchId();
    let m = this.left.Compile(s);
    let m2 = this.right.Compile(s);
    let z1 = sToInput(m, id);
    let z2 = sToInput(m2, id);
    let rep: operator.operator_join = {
      opcode: "operator_join",
      fields: {},
      inputs: { STRING1: z1, STRING2: z2 },
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = rep;
    return { id: id, reporter: rep };
  }
}
const NumericOperator = <
  T extends
    | operator.operator_add
    | operator.operator_subtract
    | operator.operator_divide
    | operator.operator_multiply
>(
  a: T["opcode"]
) =>
  class implements Reporter<T> {
    constructor(
      public num1: Literal | Reporter,
      public num2: Literal | Reporter
    ) {}
    Compile(s: spriteBase): CompiledReporter<T> {
      let id = generateScratchId();
      let m = this.num1.Compile(s);
      let m2 = this.num2.Compile(s);
      let z1 = sToInput(m, id);
      let z2 = sToInput(m2, id);
      let rep: T = {
        opcode: a,
        fields: {},
        inputs: { NUM1: z1, NUM2: z2 },
        next: null,
        parent: null,
        shadow: false,
        topLevel: false,
      } as T;
      s.blocks[id] = rep;
      return { id: id, reporter: rep };
    }
  };
export class MathOp implements Reporter<operator.mathop> {
  constructor(public num: Literal | Reporter, public type: operator.mathops) {}
  Compile(s: spriteBase): CompiledReporter<operator.mathop> {
    let id = generateScratchId();
    let m = this.num.Compile(s);

    let z1 = sToInput(m, id);

    let rep: operator.mathop = {
      opcode: "operator_mathop",
      fields: { OPERATOR: [this.type, null] },
      inputs: { NUM: z1 },
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = rep;
    return { id: id, reporter: rep };
  }
}
export class KeyPressed implements Reporter<sensing.keypressed> {
  constructor(public key: sensing.keyOption) {}
  Compile(s: spriteBase) {
    let id = generateScratchId();
    let oid = generateScratchId();
    let mblock: sensing.keypressed = {
      inputs: { KEY_OPTION: [1, oid] },
      fields: {},
      next: null,
      opcode: "sensing_keypressed",
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = mblock;
    let oblock: sensing.keyoptions = {
      topLevel: false,
      shadow: true,
      parent: id,
      opcode: "sensing_keyoptions",
      next: null,
      fields: { KEY_OPTION: [this.key, null] },
      inputs: {},
    };
    s.blocks[oid] = oblock;
    return { reporter: mblock, id };
  }
}
export class Not implements Reporter<operator.operator_not> {
  constructor(public num1: Literal | Reporter) {}
  Compile(s: spriteBase): CompiledReporter<operator.operator_not> {
    let id = generateScratchId();
    let m = this.num1.Compile(s);

    let z1 = sToInput(m, id);

    let rep: operator.operator_not = {
      opcode: "operator_not",
      fields: {},
      inputs: { OPERAND: z1 },
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = rep;
    return { id: id, reporter: rep };
  }
}
const BooleanBinaryOperator = <
  T extends
    | operator.operator_equals
    | operator.operator_gt
    | operator.operator_lt
    | operator.operator_and
    | operator.operator_or
>(
  a: T["opcode"]
) =>
  class implements Reporter<T> {
    constructor(
      public num1: Literal | Reporter,
      public num2: Literal | Reporter
    ) {}
    Compile(s: spriteBase): CompiledReporter<T> {
      let id = generateScratchId();
      let m = this.num1.Compile(s);
      let m2 = this.num2.Compile(s);
      let z1 = sToInput(m, id);
      let z2 = sToInput(m2, id);
      let rep: T = {
        opcode: a,
        fields: {},
        inputs: { OPERAND1: z1, OPERAND2: z2 },
        next: null,
        parent: null,
        shadow: false,
        topLevel: false,
      } as T;
      s.blocks[id] = rep;
      return { id: id, reporter: rep };
    }
  };

export class GotoXy implements Block {
  constructor(public x: Literal | Reporter, public y: Literal | Reporter) {}
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();
    let rx = this.x.Compile(s);
    let ry = this.y.Compile(s);
    let ix = sToInput(rx, id);
    let iy = sToInput(ry, id);

    let r: motion.gotoxy = {
      shadow: false,
      opcode: "motion_gotoxy",
      parent: null,
      next: null,
      topLevel: false,
      inputs: { X: ix, Y: iy },
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class MoveSteps implements Block {
  constructor(public steps: Literal | Reporter) {}
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();
    let rv = this.steps.Compile(s);
    let m = sToInput(rv, id);

    let r: motion.moveStepsBlock = {
      shadow: false,
      opcode: "motion_movesteps",
      parent: null,
      next: null,
      topLevel: false,
      inputs: { STEPS: m },
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class Wait implements Block {
  constructor(public seconds: Literal | Reporter) {}
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();
    let rv = this.seconds.Compile(s);
    let m = sToInput(rv, id);

    let r: control.wait = {
      shadow: false,
      opcode: "control_wait",
      parent: null,
      next: null,
      topLevel: false,
      inputs: { DURATION: m },
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class Show implements Block {
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();

    let r: looks.show = {
      shadow: false,
      opcode: "looks_show",
      parent: null,
      next: null,
      topLevel: false,
      inputs: {},
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class Hide implements Block {
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();

    let r: looks.hide = {
      shadow: false,
      opcode: "looks_hide",
      parent: null,
      next: null,
      topLevel: false,
      inputs: {},
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class AskAndWait implements Block {
  constructor(public message: Literal | Reporter) {}
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();
    let rv = this.message.Compile(s);
    let m = sToInput(rv, id);

    let r: sensing.askandwait = {
      shadow: false,
      opcode: "sensing_askandwait",
      parent: null,
      next: null,
      topLevel: false,
      inputs: { QUESTION: m },
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class Say implements Block {
  constructor(public message: Literal | Reporter) {}
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();
    let rv = this.message.Compile(s);
    let m = sToInput(rv, id);

    let r: looks.say = {
      shadow: false,
      opcode: "looks_say",
      parent: null,
      next: null,
      topLevel: false,
      inputs: { MESSAGE: m },
      fields: {},
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export class StopThisScriot implements Block {
  Compile(s: scratchSprite): CompiledBlock {
    let id = generateScratchId();
    let r: control.stop = {
      shadow: false,
      opcode: "control_stop",
      parent: null,
      next: null,
      inputs: {},
      topLevel: false,
      fields: { STOP_OPTION: ["this script", null] },
      mutation: { tagName: "mutation", children: [], hasnext: "false" },
    };
    s.blocks[id] = r;
    return { id, block: r };
  }
}
export const Add = NumericOperator("operator_add");
export const Subtract = NumericOperator("operator_subtract");
export const Divide = NumericOperator("operator_divide");
export const Multiply = NumericOperator("operator_multiply");
export const LessThan = BooleanBinaryOperator("operator_lt");
export const GreaterThan = BooleanBinaryOperator("operator_gt");
export const Equals = BooleanBinaryOperator("operator_equals");
export const And = BooleanBinaryOperator("operator_and");
export const Or = BooleanBinaryOperator("operator_or");
export class InsertIntoList implements Block {
  constructor(
    public list: List,
    public value: Literal | Reporter,
    public index: Literal | Reporter
  ) {}
  Compile(s: spriteBase): CompiledBlock {
    let id = generateScratchId();
    let v = this.value.Compile(s);
    let ind = this.index.Compile(s);
    let vin = sToInput(v, id);
    let indin = sToInput(ind, id);
    let vl: data.insertatlist = {
      topLevel: false,
      fields: { LIST: [this.list.name, this.list.id] },
      inputs: { INDEX: indin, ITEM: vin },
      next: null,
      parent: null,
      opcode: "data_insertatlist",
      shadow: false,
    };
    s.blocks[id] = vl;
    return { id, block: vl };
  }
}
export class AddToList implements Block {
  constructor(public list: List, public value: Literal | Reporter) {}
  Compile(s: spriteBase): CompiledBlock {
    let id = generateScratchId();
    let m = this.value.Compile(s);

    let z1 = sToInput(m, id);
    let block: data.addtolist = {
      opcode: "data_addtolist",
      fields: { LIST: [this.list.name, this.list.id] },
      inputs: { ITEM: z1 },
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = block;
    return { id, block };
  }
}
export class DeleteOfList implements Block {
  constructor(public list: List, public index: Literal | Reporter) {}
  Compile(s: spriteBase): CompiledBlock {
    let id = generateScratchId();
    let m = this.index.Compile(s);

    let z1 = sToInput(m, id);
    let block: data.deleteoflist = {
      opcode: "data_deleteoflist",
      fields: { LIST: [this.list.name, this.list.id] },
      inputs: { INDEX: z1 },
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = block;
    return { id, block };
  }
}
export class Answer implements Reporter<sensing.answer> {
  Compile(s: spriteBase) {
    let id = generateScratchId();
    let blck: sensing.answer = {
      opcode: "sensing_answer",
      fields: {},
      inputs: {},
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = blck;
    return { id, reporter: blck };
  }
}
export class ItemOfList implements Reporter<data.itemoflist> {
  constructor(public list: List, public index: Literal | Reporter) {}
  Compile(s: spriteBase): CompiledReporter<data.itemoflist> {
    let id = generateScratchId();
    let m = this.index.Compile(s);

    let z1 = sToInput(m, id);

    let rep: data.itemoflist = {
      opcode: "data_itemoflist",
      fields: { LIST: [this.list.name, this.list.id] },
      inputs: { INDEX: z1 },
      next: null,
      parent: null,
      shadow: false,
      topLevel: false,
    };
    s.blocks[id] = rep;
    return { id: id, reporter: rep };
  }
}

export class Argument implements Reporter {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  /**
   * MUST assign parent after compilation
   */
  newReference(s: spriteBase) {
    return this.Compile(s);
  }

  /**
   * MUST assign parent after compilation
   */
  Compile(s: spriteBase): CompiledReporter {
    let def: procedures.argument_reporter_string_number = {
      fields: { VALUE: [this.name, null] },
      inputs: {},
      next: null,
      opcode: "argument_reporter_string_number",
      parent: null,
      shadow: true,
      topLevel: false,
      x: 0,
      y: 0,
    };
    let id = generateScratchId();
    s.blocks[id] = def;
    return { id, reporter: def };
  }
}

export class FunctionDefinition implements Block {
  arguments: Argument[];
  argids: scratchId[];
  statements: Block[];
  name: string;
  constructor(name: string, args: Argument[], blocks: Block[]) {
    this.name = name;
    this.arguments = args;
    this.statements = blocks;
    this.argids = args.map((r) => generateScratchId());
  }
  Compile(s: spriteBase): CompiledBlock {
    let procid = generateScratchId();
    let protoid = generateScratchId();
    let f: procedures.procedures_prototype["inputs"] = {};

    for (const [i, m] of this.arguments.entries()) {
      let nr = m.Compile(s);
      nr.reporter.parent = protoid;
      f[this.argids[i]] = [1, nr.id];
    }
    let proto: procedures.procedures_prototype = {
      topLevel: false,
      shadow: true,
      fields: {},
      inputs: f,
      parent: procid,

      mutation: this.GetMutation(),
      opcode: "procedures_prototype",
      next: null,
    };
    let proc: procedures.procedures_definition = {
      x: 0,
      y: 0,
      next: null,
      fields: {},
      topLevel: true,
      shadow: false,
      parent: null,
      inputs: { custom_block: [1, protoid] },
      opcode: "procedures_definition",
    };
    s.blocks[protoid] = proto;
    s.blocks[procid] = proc;
    let prev: CompiledBlock = { id: procid, block: proc };
    for (const r of this.statements) {
      let m = r.Compile(s);
      prev.block.next = m.id;
      m.block.parent = prev.id;
      prev = m;
    }
    return { id: procid, block: proc };
  }

  GetMutation(): procedures.procedures_prototype["mutation"] {
    return {
      tagName: "mutation",
      argumentdefaults: JSON.stringify(new Array(this.argids.length).fill("")),
      argumentids: JSON.stringify(this.argids),
      argumentnames: JSON.stringify(this.arguments.map((e) => e.name)),

      children: [],
      proccode:
        this.name + this.arguments.reduce<string>((e, c) => e + "  %s", ""),
      warp: "true",
    };
  }
}

export class FunctionCall implements Block {
  declaration: FunctionDefinition;
  parameters: (Reporter | Literal)[];
  constructor(
    declaration: FunctionDefinition,
    parameters: (Reporter | Literal)[]
  ) {
    this.declaration = declaration;
    this.parameters = parameters;
  }
  Compile(s: spriteBase): CompiledBlock {
    let id = generateScratchId();
    let cmp: Record<string, input> = {};
    for (const [m, ir] of this.parameters.entries()) {
      let p = ir.Compile(s);
      if ("id" in p) {
        p.reporter.parent = id;
        cmp[this.declaration.argids[m]] = [2, p.id];
      } else {
        cmp[this.declaration.argids[m]] = [1, p];
      }
    }
    let m: procedures.procedures_call = {
      opcode: "procedures_call",
      next: null,
      parent: null,
      inputs: cmp,
      fields: {},
      shadow: false,
      topLevel: false,
      mutation: this.declaration.GetMutation(),
    };
    s.blocks[id] = m;
    return { id, block: m };
  }
}

export class SetVariable implements Block {
  variable: Variable;
  value: Literal | Reporter;
  constructor(variable: Variable, value: Literal | Reporter) {
    this.variable = variable;
    this.value = value;
  }
  Compile(s: spriteBase): CompiledBlock {
    let id = generateScratchId();
    let val = this.value.Compile(s);
    let inp = sToInput(val, id);
    let block: setVariableTo = {
      parent: null,
      topLevel: false,
      fields: { VARIABLE: [this.variable.name, this.variable.id] },
      inputs: { VALUE: inp },
      next: null,
      shadow: false,
      opcode: "data_setvariableto",
    };
    s.blocks[id] = block;
    return { id, block };
  }
}
export class ReplaceItemOfList implements Block {
  constructor(
    public list: List,
    public index: Literal | Reporter,
    public value: Literal | Reporter
  ) {}
  Compile(s: spriteBase): CompiledBlock {
    let id = generateScratchId();
    let val = this.value.Compile(s);
    let index = this.index.Compile(s);
    let inp_val = sToInput(val, id);
    let inp_ind = sToInput(index, id);
    let block: data.replaceitemoflist = {
      parent: null,
      topLevel: false,
      fields: { LIST: [this.list.name, this.list.id] },
      inputs: { INDEX: inp_ind, ITEM: inp_val },
      next: null,
      shadow: false,
      opcode: "data_replaceitemoflist",
    };
    s.blocks[id] = block;
    return { id, block };
  }
}
export class Variable {
  id = generateScratchId();
  constructor(public name: string) {}
  getReference(): VariableReference {
    return new VariableReference(this);
  }
}
export class List {
  id = generateScratchId();
  entries: string[];
  constructor(public name: string, entries: string[] = []) {
    this.entries = entries;
  }

  getItemAt(index: Literal | Reporter) {
    return new ItemOfList(this, index);
  }
}
export class VariableReference implements Literal {
  variable: Variable;
  constructor(variable: Variable) {
    this.variable = variable;
  }
  Compile(s: spriteBase): inputVar {
    return [12, this.variable.name, this.variable.id];
  }
}
export class Sprite {
  blocks: Block[];
  variables: Variable[];
  lists: List[];
  name: string;
  constructor(
    name: string,
    variables: Variable[],
    blocks: Block[],
    lists: List[]
  ) {
    this.variables = variables;
    this.name = name;
    this.blocks = blocks;
    this.lists = lists;
  }
  Compile(): scratchSprite {
    let sprite: scratchSprite = {
      lists: {},
      name: this.name,
      blocks: {},
      broadcasts: {},
      isStage: false,
      variables: {
        "`jEk@4|i[#Fk?(8x)AV.-my variable": ["my variable", "0"],
      },
      sounds: [],
      currentCostume: 0,
      costumes: [
        {
          assetId: "bcf454acf82e4504149f7ffe07081dbc",
          name: "costume1",
          bitmapResolution: 1,
          md5ext: "bcf454acf82e4504149f7ffe07081dbc.svg",
          dataFormat: "svg",
          rotationCenterX: 48,
          rotationCenterY: 50,
        },
        {
          assetId: "0fb9be3e8397c983338cb71dc84d0b25",
          name: "costume2",
          bitmapResolution: 1,
          md5ext: "0fb9be3e8397c983338cb71dc84d0b25.svg",
          dataFormat: "svg",
          rotationCenterX: 46,
          rotationCenterY: 53,
        },
      ],
      volume: 100,
      layerOrder: 1,
      visible: false,
      x: 208,
      y: -124,
      size: 100,
      direction: 90,
      draggable: false,
      rotationStyle: "all around",
    };

    sprite.variables = Object.fromEntries(
      Object.entries(this.variables).map((f) => [f[1].id, [f[1].name, "0"]])
    );
    sprite.lists = Object.fromEntries(
      Object.entries(this.lists).map((f) => [
        f[1].id,
        [f[1].name, f[1].entries],
      ])
    );
    this.blocks.forEach((b) => {
      console.log(b);
      b.Compile(sprite);
    });
    return sprite;
  }
}

// let myblock = new WhenFlagClicked([]);
// function createFunction(s: scratchSprite) {
//   let arg = new Argument("a1");
//   //   let nr = arg.newReference(s);
//   let myFn = new FunctionDefinition("Function", [arg], [arg]);
// }
let add = new Add(new LiteralNumber(3), new LiteralNumber(4));
let arg = new Argument("a1");
let mv = new Variable("Test Variable");
let myList = new List("Test List");
let my2ndblock = new FunctionDefinition(
  "myFn",
  [arg],
  [
    new SetVariable(mv, new Add(mv.getReference(), arg)),
    new AddToList(myList, new LiteralNumber(40)),
    new IfElse(
      new Equals(myList.getItemAt(new LiteralNumber(1)), new LiteralNumber(8)),
      [],
      [
        new SetVariable(mv, new LiteralString("Falsy")),
        new ReplaceItemOfList(
          myList,
          new LiteralNumber(1),
          new LiteralString("Not 40...")
        ),
      ]
    ),
  ]
);
let r = new FunctionCall(my2ndblock, [add]);

let v = new WhenFlagClicked([
  r,
  new SetVariable(mv, new LiteralNumber(4)),

  new SetVariable(mv, new Add(mv.getReference(), new LiteralNumber(4))),
  new IfElse(
    new Equals(mv.getReference(), new LiteralNumber(8)),
    [new SetVariable(mv, new LiteralString("Truthy"))],
    [new SetVariable(mv, new LiteralString("Falsy"))]
  ),
]);

// let Stack = new List("Stack");

// let Push = (val: string | number) => new AddToList();
