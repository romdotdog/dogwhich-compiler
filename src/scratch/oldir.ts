// import { control, inputVar, scratchBlock, scratchId } from "./structure";
// import { Project } from "./loader";
// import { saveProject } from "./zipping";
// let counter = 24;
// export function generateScratchId(): scratchId {
//   counter++;
//   return `Generated${counter}`;
// }

// type blockWithId = (
//   | procedures_definition
//   | procedures_prototype
//   | scratchBlock
// ) & { id: scratchId };
// type withId<
//   e extends scratchBlock | procedures_definition | procedures_prototype
// > = e & { id: scratchId };
// const Blocks: Record<
//   string,
//   blockWithId //@ts-ignore
// > = Project.targets[0].blocks;
// namespace Scratch {
//   export class WithScratchId {
//     id: scratchId = generateScratchId();
//   }
//   export class Sprite {
//     variables: Map<string, Variable> = new Map();
//   }
//   export class Variable extends WithScratchId {
//     name: string;
//     constructor(name: string) {
//       super();
//       this.name = name;
//     }
//     /** Used to generate a var referenece at compile time: */
//     getRef(): inputVar {
//       return [12, this.name, this.id, 0, 0];
//     }
//   }

//   export class VariableReference {
//     references: Variable;
//     constructor(ref: Variable) {
//       this.references = ref;
//     }
//   }

//   export class Start {}
// }

// namespace S {
//   const CTOR =
//     <T extends new (...args: G) => any, G extends Array<any>>(em: T) =>
//     (
//       ...e: ConstructorParameters<T>
//     ): T extends new (...args: any) => infer P ? P : never =>
//       new em(...e);

//   export type Statement = Classes.Statement;
//   namespace Classes {
//     interface Compilable {
//       Compile(): blockWithId;
//     }
//     export type Statement =
//       | Push
//       | Add
//       | MoveTo
//       | Fn
//       | Local.Get
//       | Local.Set
//       | IfElse
//       | If
//       | Eq;
//     export class Add {
//       id: 1 = 1;
//       Compile() {}
//     }

//     export class MoveTo {
//       id: 2 = 2;
//     }
//     export class Fn {
//       id: 3 = 3;
//       constructor(public statements: Statement[]) {}
//       Compile() {
//         const procedureId = generateScratchId();
//         const prototypeId = generateScratchId();
//         const proc: withId<procedures_definition> = {
//           id: procedureId,
//           opcode: "procedures_definition",
//           next: null,
//           inputs: { custom_block: [1, prototypeId] },
//           fields: {},
//           shadow: false,
//           topLevel: true,
//           x: 0,
//           y: 0,
//         };
//         const prototype: withId<procedures_prototype> = {
//           id: prototypeId,
//           opcode: "procedures_prototype",
//           next: null,
//           parent: procedureId,
//           inputs: {},
//           fields: {},
//           shadow: true,
//           topLevel: false,
//           mutation: {
//             tagName: "mutation",
//             children: [],
//             proccode: "MyFn",
//             argumentids: "[]",
//             argumentnames: "[]",
//             argumentdefaults: "[]",
//             warp: "false",
//           },
//         };
//         let prevId: blockWithId = proc;

//         for (const i of this.statements) {
//           console.log(i);
//           if (i instanceof Push) {
//             let r = generatePush(prevId.id, i.value + "");
//             prevId.next = r.id;
//             prevId = r;
//           } else if (i instanceof IfElse) {
//             // generateIfElse(prevId,)
//           }
//         }
//       }
//     }

//     export class Push {
//       id: 4 = 4;
//       constructor(public value: string | number) {}
//     }
//     export namespace Local {
//       export class Get {
//         id: 5 = 5;
//         constructor() {}
//       }
//       export class Set {
//         id: 6 = 6;
//         constructor() {}
//       }
//     }
//     export class Eq {
//       id: 7 = 7;
//       constructor() {}
//     }
//     export class If {
//       id: 7 = 7;
//       constructor(public statements: Statement[]) {}
//     }
//     export class IfElse {
//       id: 8 = 8;
//       constructor(public ifTrue: Statement[], public ifFalse: Statement[]) {}
//     }
//   }
//   export const Fn = CTOR(Classes.Fn);
//   export const Add = CTOR(Classes.Add);
//   export const Push = CTOR(Classes.Push);
//   export const MoveTo = CTOR(Classes.Push);
//   export const Eq = CTOR(Classes.Eq);
//   export const If = CTOR(Classes.If);
//   export const IfElse = CTOR(Classes.IfElse);
//   export const Local = {
//     Set: CTOR(Classes.Local.Set),
//     Get: CTOR(Classes.Local.Get),
//   };
// }

// // console.log(S.Push(2))
// let myFunc = S.Fn([
//   S.Push(2),
//   S.Eq(),
//   S.IfElse(
//     [S.Push("Value is equal to two")],
//     [S.Push("Value is not equal to two")]
//   ),
// ]);
// // console.log(myFunc.Compile());
// // console.log(Blocks);

// interface procedures_definition {
//   opcode: "procedures_definition";
//   next: string | null;
//   shadow: false;
//   topLevel: true;
//   fields: {};
//   inputs: { custom_block: [1, string] };
//   x: number;
//   y: number;
// }
// interface procedures_prototype {
//   opcode: "procedures_prototype";
//   next: null;
//   parent: string;
//   inputs: {};
//   fields: {};
//   shadow: true;
//   topLevel: false;
//   mutation: {
//     tagName: "mutation";
//     children: [];
//     proccode: string;
//     argumentids: "[]";
//     argumentnames: "[]";
//     argumentdefaults: "[]";
//     warp: "false";
//   };
// }

// function compileFn() {}

// function generateIfElse(
//   parent: scratchId,
//   condition: scratchId,
//   ifTrue: scratchId,
//   ifFalse: scratchId
// ) {
//   let id = generateScratchId();
//   let m: withId<control.control_if_else> = {
//     id,
//     opcode: "control_if_else",
//     fields: {},
//     inputs: {
//       CONDITION: [2, condition],
//       SUBSTACK: [2, ifTrue],
//       SUBSTACK2: [2, ifFalse],
//     },
//     next: null,
//     parent,
//     shadow: false,
//     topLevel: false,
//   };

//   return m;
// }

// function generatePush(parent: scratchId, value: string) {
//   let id = generateScratchId();
//   const proc: withId<any> = {
//     opcode: "procedures_call",
//     next: null,
//     parent: parent,
//     inputs: {
//       "_oqU$|Y]?Mw8#yCA8_Z8": [1, [10, value]],
//       "aU]db^J@8m2/DI}%)@wm": [1, [10, "0"]],
//     },
//     fields: {},
//     shadow: false,
//     topLevel: false,
//     mutation: {
//       tagName: "mutation",
//       children: [],
//       proccode: "Push %s %s",
//       argumentids: '["_oqU$|Y]?Mw8#yCA8_Z8","aU]db^J@8m2/DI}%)@wm"]',
//       warp: "false",
//     },
//   };
//   return proc as blockWithId;
// }
