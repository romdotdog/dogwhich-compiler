import fs from "fs";

export interface scratchMeta {
  semver: string;
  vm: string;
  agent: string;
}

export interface scratchProject {
  meta: scratchMeta;
  extensions: string[];
  targets: scratchTarget[];
}

export type scratchTarget = scratchStage | scratchSprite;

// console.log(r.targets);
export interface spriteBase {
  variables: Record<string, scratchVariable>;
  lists: {
    [key: scratchId]: [/** Name */ string, /** entries */ string[]];
  };
  broadcasts: {};
  blocks: Record<string, scratchBlock | reporter>;
  sounds: [];
}

export interface scratchStage extends spriteBase {
  isStage: true;
  name: "Stage";
}
export interface scratchSprite extends spriteBase {
  isStage: false;
  name: string;
  currentCostume: number;
  costumes: {
    assetId: string;
    name: string;
    bitmapResolution: number;
    md5ext: string;
    dataFormat: string;
    rotationCenterX: number;
    rotationCenterY: number;
  }[];
  volume: 100;
  layerOrder: 1;
  visible: false;
  x: 208;
  y: -124;
  size: 100;
  direction: 90;
  draggable: false;
  rotationStyle: "all around";
}
export function isStage(t: scratchTarget): t is scratchStage {
  return "isStage" in t && t.isStage;
}

export type scratchBlock =
  | flagClickedBlock
  | setVariableTo
  | looks.lookBlock
  | changeVariableBy
  | motion.motionBlock
  | control.controlBlock
  | procedures.procedure_block
  | data.data
  | control.stop
  | sensing.sensing
  | pen.pen;

export type scratchId = string;

export interface scratchBlockBase {}
export interface scratchXYblock {
  x: number;
  y: number;
}
export interface flagClickedBlock extends scratchBlockBase, scratchXYblock {
  opcode: "event_whenflagclicked";
  next: scratchId | null;
  parent: null;
  inputs: {};
  fields: {};
  shadow: false;
  topLevel: true;
}

export interface setVariableTo {
  opcode: "data_setvariableto";
  next: scratchId | null;
  parent: scratchId | null;

  inputs: { VALUE: input };
  fields: { VARIABLE: [string, scratchId] };
  shadow: false;
  topLevel: false;
}

export interface changeVariableBy {
  opcode: "data_changevariableby";
  next: scratchId | null;
  parent: scratchId | null;

  inputs: { VALUE: input };
  fields: { VARIABLE: field };
  shadow: false;
  topLevel: false;
}

export namespace data {
  export type data =
    | addtolist
    | replaceitemoflist
    | deleteoflist
    | insertatlist;
  export interface addtolist {
    opcode: "data_addtolist";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { ITEM: input };
    /** LIST: [listname, listId] */
    fields: { LIST: [string, scratchId] };
    shadow: false;
    topLevel: false;
  }
  export interface itemoflist {
    opcode: "data_itemoflist";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { INDEX: input };
    fields: { LIST: [string, string] };
    shadow: false;
    topLevel: false;
  }
  export interface replaceitemoflist {
    opcode: "data_replaceitemoflist";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {
      INDEX: input;
      ITEM: input;
    };
    fields: { LIST: [string, scratchId] };
    shadow: false;
    topLevel: false;
  }
  export interface deleteoflist {
    opcode: "data_deleteoflist";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { INDEX: input };
    fields: { LIST: [string, scratchId] };
    shadow: false;
    topLevel: false;
  }
  export interface insertatlist {
    opcode: "data_insertatlist";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {
      ITEM: input;
      INDEX: input;
    };
    fields: { LIST: [string, scratchId] };
    shadow: false;
    topLevel: false;
  }
}

export namespace pen {
  export type pen =
    | clear
    | stamp
    | penDown
    | penUp
    | setPenColorToColor
    | setPenSizeTo;

  export interface clear {
    opcode: "pen_clear";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {};
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface stamp {
    opcode: "pen_stamp";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {};
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface penDown {
    opcode: "pen_penDown";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {};
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface penUp {
    opcode: "pen_penUp";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {};
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface setPenColorToColor {
    opcode: "pen_setPenColorToColor";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { COLOR: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface setPenSizeTo {
    opcode: "pen_setPenSizeTo";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { SIZE: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
}

export namespace looks {
  export interface sayForSecs {
    opcode: "looks_sayforsecs";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { MESSAGE: []; SECS: [] };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface say {
    opcode: "looks_say";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { MESSAGE: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface show {
    opcode: "looks_show";
    next: scratchId | null;
    parent: scratchId | null;
    shadow: false;
    topLevel: false;
    inputs: {};
    fields: {};
  }
  export interface hide {
    opcode: "looks_hide";
    next: scratchId | null;
    parent: scratchId | null;
    shadow: false;
    topLevel: false;
    inputs: {};
    fields: {};
  }
  export type lookBlock = show | hide | sayForSecs | say;
}

export namespace motion {
  export interface pointInDirection {
    opcode: "motion_pointindirection";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { DIRECTION: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface pointTowards {
    opcode: "motion_pointtowards";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { TOWARDS: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface moveStepsBlock {
    opcode: "motion_movesteps";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { STEPS: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface gotoxy {
    opcode: "motion_gotoxy";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { X: input; Y: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export type motionBlock =
    | pointInDirection
    | moveStepsBlock
    | pointTowards
    | gotoxy;
}

export type reporter =
  | operator.operator
  | procedures.argument_reporter_string_number
  | data.itemoflist
  | sensing.keypressed
  | sensing.answer;

export namespace operator {
  export type operator =
    | operator_add
    | operator_subtract
    | operator_equals
    | operator_multiply
    | operator_divide
    | operator_gt
    | operator_lt
    | operator_and
    | operator_or
    | operator_join
    | operator_not
    | mathop;

  export type numOperator<T extends string> = {
    opcode: T;
    next: null;
    parent: string | null;
    inputs: {
      NUM1: input;
      NUM2: input;
    };
    fields: {};
    shadow: false;
    topLevel: false;
  };

  export type binaryOperator<T extends string> = {
    opcode: T;
    next: null;
    parent: string | null;
    inputs: {
      OPERAND1: input;
      OPERAND2: input;
    };
    fields: {};
    shadow: false;
    topLevel: false;
  };
  export const mathops = [
    "abs",
    "floor",
    "ceiling",
    "sqrt",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "ln",
    "log",
  ] as const;
  export type mathops = typeof mathops[number];
  export interface mathop {
    opcode: "operator_mathop";
    next: null;
    parent: null;
    inputs: { NUM: input };
    fields: { OPERATOR: [mathops, null] };
    shadow: false;
    topLevel: false;
  }
  export type operator_add = numOperator<"operator_add">;
  export type operator_subtract = numOperator<"operator_subtract">;
  export type operator_multiply = numOperator<"operator_multiply">;
  export type operator_divide = numOperator<"operator_divide">;

  export type operator_equals = binaryOperator<"operator_equals">;
  export type operator_gt = binaryOperator<"operator_gt">;
  export type operator_lt = binaryOperator<"operator_lt">;
  export type operator_and = binaryOperator<"operator_and">;
  export type operator_or = binaryOperator<"operator_or">;
  export interface operator_not {
    opcode: "operator_not";
    next: null;
    parent: string | null;
    inputs: {
      OPERAND: input;
    };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface operator_join {
    opcode: "operator_join";
    next: null;
    parent: string | null;
    inputs: {
      STRING1: input;
      STRING2: input;
    };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  // export type operator_equals = {
  //   opcode: "operator_equals";
  //   next: null;
  //   parent: string | null;
  //   inputs: {
  //     OPERAND1: input;
  //     OPERAND2: input;
  //   };
  //   fields: {};
  //   shadow: false;
  //   topLevel: false;
  // };
}
export namespace sensing {
  export type sensing = askandwait | keyoptions;
  export interface answer {
    opcode: "sensing_answer";
    next: null;
    parent: scratchId | null;
    inputs: {};
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface askandwait {
    opcode: "sensing_askandwait";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { QUESTION: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface keypressed {
    opcode: "sensing_keypressed";
    next: null;
    parent: scratchId | null;
    inputs: { KEY_OPTION: [1, scratchId | null] };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export const keyOption = [
    "space",
    "up arrow",
    "down arrow",
    "left arrow",
    "right arrow",
    "any",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
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
  ] as const;
  export type keyOption = typeof keyOption[number];
  export interface keyoptions {
    opcode: "sensing_keyoptions";
    next: null;
    parent: scratchId | null;
    inputs: {};
    fields: { KEY_OPTION: [keyOption, null] };
    shadow: true;
    topLevel: false;
  }
}
export namespace control {
  export interface wait {
    opcode: "control_wait";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { DURATION: input };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface stop {
    opcode: "control_stop";
    next: null;
    parent: null;
    inputs: {};
    fields: { STOP_OPTION: ["this script", null] };
    shadow: false;
    topLevel: false;
    mutation: {
      tagName: "mutation";
      children: [];
      hasnext: "false";
    };
  }
  export interface repeatBlock {
    opcode: "control_repeat";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { TIMES: input; SUBSTACK: [2, scratchId | null] };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface control_if_else {
    opcode: "control_if_else";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: {
      CONDITION: input;
      SUBSTACK: [2, scratchId | null];
      SUBSTACK2: [2, scratchId | null];
    };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export interface forever {
    opcode: "control_forever";
    next: scratchId | null;
    parent: scratchId | null;
    inputs: { SUBSTACK: [2, scratchId | null] };
    fields: {};
    shadow: false;
    topLevel: false;
  }
  export type controlBlock = repeatBlock | control_if_else | forever | wait;
}
type scratchVariable = [string, string];

export type input =
  | [1, blockAsArray]
  | [2, scratchId | inputVar]
  | [3, scratchId | inputVar, blockAsArray];
export type blockAsArray = inputNumArr | inputStrArr | inputVar;

export type inputNumArr = [4, `${number}`];
export type inputStrArr = [10, string];
export type inputVar = [12, string, scratchId];

const varnamesIwant = ["hello", "prewritten", "code"];
type field = [string, scratchId];
// if (isStage(Project.targets[1])) {
//   console.log(">>");
//   console.log(Project.targets[1]);
// }

// let mrp = Project.targets.find(isStage)!;
// if (mrp) {
//   console.log(mrp.variables);
//   let ctr = 0;
//   varnamesIwant.forEach((v) => {
//     ctr++;
//     mrp.variables[`\`jEk@${ctr}|i[#Fk?(8x)AV.-my variable`] = [v, 0];
//   });
//   console.log(mrp.variables);
// }

// export function getStage() {
//   return Project.targets.find(isStage)!;
// }

// export function saveProjectToFile() {
//   let m = JSON.stringify(Project);
//   fs.writeFileSync("./out.json", m);
// }
type m = String & { x: 3 };
let e = new String("r");

export namespace procedures {
  export type procedure_block =
    | procedures_prototype
    | procedures_definition
    | procedures_call;
  export interface argument_reporter_string_number extends scratchXYblock {
    opcode: "argument_reporter_string_number";
    next: null;
    /** Parent is prototype */
    parent: scratchId | null;
    inputs: {};
    fields: {
      /** string is name of param **/
      VALUE: [string, null];
    };
    shadow: true;
    topLevel: false;
  }

  export interface procedures_definition extends scratchXYblock {
    opcode: "procedures_definition";
    next: scratchId | null;
    parent: null;
    inputs: { custom_block: [1, scratchId] };
    fields: {};
    shadow: false;
    topLevel: true;
  }
  export interface procedures_prototype {
    opcode: "procedures_prototype";
    next: null;
    /** parent is procedures_definition */
    parent: scratchId | null;
    /**  for [1,scratchid] scratchid is id of argument_reporter_string_number.*/
    inputs: { [s: scratchId]: [1, scratchId] };
    fields: {};
    shadow: true;
    topLevel: false;
    mutation: {
      tagName: "mutation";
      children: [];
      /** Name of function followed by '%s' repeated for the # of parameters */
      proccode: string;
      /** stringified list of input keys */
      argumentids: string;
      /** stringified list of parameter names */
      argumentnames: string;
      argumentdefaults: string;
      warp: "true";
    };
  }

  export interface procedures_call {
    opcode: "procedures_call";
    next: null;
    parent: scratchId | null;
    inputs: { [s: scratchId]: input };
    fields: {};
    shadow: false;
    topLevel: false;
    mutation: {
      tagName: "mutation";
      children: [];
      proccode: string;
      argumentids: string;
      warp: "true";
    };
  }
}
