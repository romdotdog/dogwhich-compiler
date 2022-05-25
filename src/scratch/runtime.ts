/**
 * @fileoverview File containing stack machine code.
 *
 * */
import { Block } from ".";
import {
  Add,
  AddToList,
  DeleteOfList,
  Divide,
  InsertIntoList,
  ItemOfList,
  List,
  Literal,
  LiteralNumber,
  LiteralString,
  MultipleBlocks,
  Multiply,
  Reporter,
  Sprite,
  Subtract,
  WhenFlagClicked,
} from "./ir";
import { Project } from "./loader";
import { saveProject } from "./zipping";
export const Stack = new List("Stack");

export function ListUtilities(Stack: List) {
  const push = (Value: Literal | Reporter, dropCount: number = 0): Block[] => [
    new InsertIntoList(Stack, Value, new LiteralNumber(1)),
    ...new Array(dropCount).fill(new DeleteOfList(Stack, new LiteralNumber(2))),
  ];
  const drop = (dropCount: number): Block[] => [
    ...new Array(dropCount).fill(new DeleteOfList(Stack, new LiteralNumber(2))),
  ];
  return { push, drop };
}

let lu = ListUtilities(Stack);
const push = lu.push;
const drop = lu.drop;
export { push, drop };
export const stackItem = (e: number | LiteralNumber | Reporter) =>
  Stack.getItemAt(toNumLit(e));
// ^ Weird auto indent error here, this comment removes it

const literal = (e: string | number) =>
  typeof e == "string" ? new LiteralString(e) : new LiteralNumber(e);

const toNumLit = (e: number | LiteralNumber | Reporter) =>
  typeof e == "number" ? new LiteralNumber(e) : e;

const add = (
  e: number | LiteralNumber | Reporter,
  r: number | LiteralNumber | Reporter
) => new Add(toNumLit(e), toNumLit(r));
const sub = (
  e: number | LiteralNumber | Reporter,
  r: number | LiteralNumber | Reporter
) => new Subtract(toNumLit(e), toNumLit(r));
const mult = (
  e: number | LiteralNumber | Reporter,
  r: number | LiteralNumber | Reporter
) => new Multiply(toNumLit(e), toNumLit(r));
const div = (
  e: number | LiteralNumber | Reporter,
  r: number | LiteralNumber | Reporter
) => new Divide(toNumLit(e), toNumLit(r));

// let re = new Sprite(
//   "spritte1",
//   [],
//   [
//     new WhenFlagClicked([
//       ...push(new LiteralString("None if this was written manually!:")),
//       ...push(literal(20)),
//       ...push(literal(3)),
//       ...push(add(stackItem(1), stackItem(2)), 2),
//       ...push(div(stackItem(1), 10), 1),
//     ]),
//   ],
//   []
// ).Compile();

// // Project.targets[1] = new Sprite("Sprite1").Compile();
// console.log(re);
// // console.log(Project.targets[1]);
// Project.targets[1] = re;
// //@ts-ignore
// Project.monitors = [];
// console.log("HERE");
// saveProject(JSON.stringify(Project));
