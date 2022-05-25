import { IRelement } from "../comp";
import {
  Block,
  DeleteOfList,
  List,
  LiteralNumber,
  LiteralString,
  ReplaceItemOfList,
} from "../scratch";
import { ListUtilities } from "../scratch/runtime";

export const Locals = new List("Locals");
// const r = ListUtilities(Locals);
export class LocalVariable {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export class BlockAllocation {
  parent?: BlockAllocation;
  variables: LocalVariable[] = [];
  constructor(variables: LocalVariable[], parent?: BlockAllocation) {
    this.variables = variables;
    this.parent = parent;
  }
  getIndexForVar(name: string): number {
    // v1 <-
    // v2
    let variable = this.variables.findIndex((r) => r.name == name);
    if (variable != -1) {
      return this.variables.length - variable;
    } else if (this.parent) {
      return this.parent.getIndexForVar(name) + this.variables.length;
    } else {
      throw new Error(`Local variable ${name} not found in scope.`);
    }
  }
  getItem(name: string) {
    return Locals.getItemAt(new LiteralNumber(this.getIndexForVar(name)));
  }

  set(name: string, value: IRelement) {
    return new IRelement(
      [
        ...value.blocks,
        new ReplaceItemOfList(
          Locals,
          new LiteralNumber(this.getIndexForVar(name)),
          value.reporter
        ),
      ],
      new LiteralNumber(this.getIndexForVar(name)),
      0
    );
  }

  add(lvar: LocalVariable) {
    this.variables.push(lvar);
  }
  deAlloc(l: List): IRelement {
    return new IRelement(
      new Array(this.variables.length).fill(
        new DeleteOfList(l, new LiteralNumber(1))
      ),
      new LiteralString("THIS SHOULD NOT BE HERE")
    );
  }
  deAllocAll(l: List): Block[] {
    return [
      ...(this.parent?.deAllocAll(l) ?? []),
      ...new Array(this.variables.length).fill(
        new DeleteOfList(l, new LiteralNumber(1))
      ),
    ];
  }
}

export class BlockManager {
  top: BlockAllocation;
  list: List;
  push(locals: LocalVariable[]) {
    this.top.variables.push(...locals);
  }
  scope() {
    this.top = new BlockAllocation([], this.top);
  }
  pop(): IRelement {
    let tr = this.top.deAlloc(this.list);
    this.top = this.top.parent!;
    return tr;
  }

  constructor(root: BlockAllocation, list: List) {
    this.top = root;
    this.list = list;
  }
}
