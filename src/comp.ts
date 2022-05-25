import {
  BlockAllocation,
  BlockManager,
  Locals,
  LocalVariable,
} from "./ir/locals";
import {
  AssignmentExpression,
  ExpressionStatement,
  FunctionDeclaration,
  SpriteDeclaration,
  Expression,
  PropertyAccessExpression,
  ThisExpression,
  IdentifierExpression,
  BinaryExpression,
  BinaryExpressionType,
  NumericExpression,
  IfStatement,
  Statement,
  IfElseStatement,
  StringExpression,
  ReturnStatement,
  LetStatement,
  FunctionCallExpression,
  ForeverStatemenet,
  ArrayAccessExpression,
  UnaryExpression,
  UnaryExpressionType,
  RepeatStatement,
} from "./parser";
import {
  Block,
  Sprite,
  Variable,
  Reporter,
  sToInput,
  Literal,
  VariableReference,
  Add,
  Subtract,
  Multiply,
  SetVariable,
  LiteralNumber,
  FunctionDefinition,
  WhenFlagClicked,
  Equals,
  IfElse,
  LessThan,
  GreaterThan,
  LiteralString,
  MultipleBlocks,
  StopThisScriot,
  FunctionCall,
  DeleteOfList,
  InsertIntoList,
  MoveSteps,
  Forever,
  GotoXy,
  Divide,
  Say,
  List,
  AddToList,
  ReplaceItemOfList,
  Or,
  And,
  Show,
  Hide,
  Answer,
  AskAndWait,
  KeyPressed,
  Join,
  Pen,
  Wait,
  MathOp,
  Repeat,
  Not,
} from "./scratch";
import { drop, push, stackItem } from "./scratch/runtime";
import { blockAsArray, operator, sensing } from "./scratch/structure";
interface CompilationContext {
  variables: Map<string, Variable>;
  lists: Map<string, List>;
  functions: Map<string, FunctionDefinition>;
  locals: BlockManager;
}
function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(`Assertaton Error: ${msg}`);
}

export class IRelement {
  blocks: Block[];
  isPure(): boolean {
    return this.blocks.length == 0 && this.pushes == 0;
  }
  reporter: Literal | Reporter;
  constructor(
    blocks: Block[],
    reporter: Literal | Reporter,
    pushes: number = 0
  ) {
    this.blocks = blocks;
    this.reporter = reporter;
    this.pushes = pushes;
  }

  pushes: number;
}

function CompileExpr(
  e: Expression,
  { variables, functions, locals, lists }: CompilationContext
): IRelement {
  const cmp = (e: Expression) =>
    CompileExpr(e, { variables, functions, locals, lists });
  if (e instanceof IdentifierExpression) {
    return new IRelement([], locals.top.getItem(e.value), 0);
  }
  if (e instanceof ArrayAccessExpression) {
    let arr;
    if (
      e.accessing instanceof PropertyAccessExpression &&
      e.accessing.left instanceof ThisExpression &&
      e.accessing.right instanceof IdentifierExpression &&
      (arr = lists.get(e.accessing.right.value))
    ) {
      let ind = cmp(e.index);
      if (ind.isPure()) {
        return new IRelement([], arr.getItemAt(ind.reporter));
      } else {
        return new IRelement(
          [
            ...ind.blocks,
            ...push(arr.getItemAt(ind.reporter)),
            ...drop(ind.pushes),
          ],
          stackItem(1),
          1
        );
      }
    } else throw new Error("Array not in scope.");
  }
  if (e instanceof PropertyAccessExpression) {
    if (!(e.left instanceof ThisExpression))
      throw new Error("CANNOT ACCESS SOMETHING OTHER THAN `this`");
    assert(
      e.right instanceof IdentifierExpression,
      " must access with identifier"
    );
    let name = (e.right as IdentifierExpression).value;
    assert(variables.has(name), " varaible does not exist");
    let v = variables.get(name)!;
    return new IRelement([], v.getReference());
  } else if (e instanceof BinaryExpression) {
    let left = cmp(e.left);
    let right = cmp(e.right);
    let blcks = [...left.blocks, ...right.blocks];
    switch (e.type) {
      case BinaryExpressionType.plus:
        return new IRelement(blcks, new Add(left.reporter, right.reporter));
      case BinaryExpressionType.divide:
        return new IRelement(blcks, new Divide(left.reporter, right.reporter));
      case BinaryExpressionType.minus:
        return new IRelement(
          blcks,
          new Subtract(left.reporter, right.reporter)
        );
      case BinaryExpressionType.times:
        return new IRelement(
          blcks,
          new Multiply(left.reporter, right.reporter)
        );
      case BinaryExpressionType.equals_equals:
        return new IRelement(blcks, new Equals(left.reporter, right.reporter));
      case BinaryExpressionType.less_than:
        return new IRelement(
          blcks,
          new LessThan(left.reporter, right.reporter)
        );
      case BinaryExpressionType.join:
        return new IRelement(blcks, new Join(left.reporter, right.reporter));
        break;
      case BinaryExpressionType.greater_than:
        return new IRelement(
          blcks,
          new GreaterThan(left.reporter, right.reporter)
        );
      case BinaryExpressionType.or:
        return new IRelement(blcks, new Or(left.reporter, right.reporter));
      case BinaryExpressionType.and:
        return new IRelement(blcks, new And(left.reporter, right.reporter));
    }
  } else if (e instanceof NumericExpression) {
    return new IRelement([], new LiteralNumber(parseFloat(e.value)));
  } else if (e instanceof StringExpression) {
    return new IRelement([], new LiteralString(e.value));
  } else if (e instanceof FunctionCallExpression) {
    if (
      e.calling instanceof PropertyAccessExpression &&
      e.calling.left instanceof PropertyAccessExpression &&
      e.calling.left.right instanceof IdentifierExpression &&
      e.calling.right instanceof IdentifierExpression &&
      e.calling.left.left instanceof ThisExpression
    ) {
      let listAccessing;
      if ((listAccessing = lists.get(e.calling.left.right.value))) {
        switch (e.calling.right.value) {
          case "push":
            assert(e.parameters.length == 1, "push takes one parameter.");
            let ind = cmp(e.parameters[0]);

            return new IRelement(
              [
                ...ind.blocks,
                new AddToList(listAccessing, ind.reporter),
                ...drop(ind.pushes),
              ],
              new LiteralString("Should not exist"),
              0
            );
            break;
        }
      } else throw new Error("List not in scope.");
    } else if (
      e.calling instanceof PropertyAccessExpression &&
      e.calling.left instanceof IdentifierExpression &&
      e.calling.left.value == "scratch" &&
      e.calling.right instanceof IdentifierExpression
    ) {
      switch (e.calling.right.value) {
        case "show":
          return new IRelement(
            [new Show()],
            new LiteralString("Should not exist"),
            0
          );
          break;
        case "hide":
          return new IRelement(
            [new Hide()],
            new LiteralString("Should not exist"),
            0
          );
          break;
        case "penDown":
          return new IRelement(
            [new Pen.PenDown()],
            new LiteralString("Should not exist"),
            0
          );
          break;
        case "penUp":
          return new IRelement(
            [new Pen.PenUp()],
            new LiteralString("Should not exist"),
            0
          );
          break;
        case "penClear":
          return new IRelement(
            [new Pen.Clear()],
            new LiteralString("Should not exist"),
            0
          );
          break;

        case "moveSteps":
          assert(e.parameters.length == 1, "moveSteps takes one parameter.");
          let ind = cmp(e.parameters[0]);

          return new IRelement(
            [...ind.blocks, new MoveSteps(ind.reporter), ...drop(ind.pushes)],
            new LiteralString("Should not exist"),
            0
          );
          break;
        case "setPenSize":
          {
            assert(e.parameters.length == 1, "setPenSize takes one parameter.");
            let ind = cmp(e.parameters[0]);

            return new IRelement(
              [
                ...ind.blocks,
                new Pen.SetSize(ind.reporter),
                ...drop(ind.pushes),
              ],
              new LiteralString("Should not exist"),
              0
            );
          }
          break;

        case "keyIsPressed":
          {
            assert(
              e.parameters.length == 1 &&
                e.parameters[0] instanceof StringExpression,
              "KeyIsPressed takes one string literal parameter."
            );
            assert(
              sensing.keyOption.includes(e.parameters[0].value as any),
              `key ${e.parameters[0].value} not found.`
            );
            let ind = cmp(e.parameters[0]);

            return new IRelement(
              [],
              new KeyPressed(e.parameters[0].value as sensing.keyOption),
              0
            );
          }
          break;
        case "say":
          {
            assert(e.parameters.length == 1, "say takes one parameter.");
            let ind = cmp(e.parameters[0]);

            return new IRelement(
              [...ind.blocks, new Say(ind.reporter), ...drop(ind.pushes)],
              new LiteralString("Should not exist"),
              0
            );
          }
          break;
        case "wait":
          {
            assert(e.parameters.length == 1, "wait takes one parameter.");
            let ind = cmp(e.parameters[0]);

            return new IRelement(
              [...ind.blocks, new Wait(ind.reporter), ...drop(ind.pushes)],
              new Answer(),
              0
            );
          }
          break;
        case "ask":
          {
            assert(e.parameters.length == 1, "ask takes one parameter.");
            let ind = cmp(e.parameters[0]);

            return new IRelement(
              [
                ...ind.blocks,
                new AskAndWait(ind.reporter),
                ...drop(ind.pushes),
              ],
              new Answer(),
              0
            );
          }
          break;
        case "moveTo":
          assert(e.parameters.length == 2, "moveTo takes wo parameter.");
          let x = cmp(e.parameters[0]);
          let y = cmp(e.parameters[1]);
          let i = 1;
          let rx = x.pushes == 0 ? x.reporter : (i++, stackItem(1));
          let ry = y.pushes == 0 ? y.reporter : stackItem(i);
          return new IRelement(
            [
              ...x.blocks,
              ...y.blocks,
              new GotoXy(rx, ry),
              ...drop(x.pushes + y.pushes),
            ],
            new LiteralString("Should not exist"),
            0
          );
          break;
          GotoXy;
      }
    } else if (
      e.calling instanceof PropertyAccessExpression &&
      e.calling.left instanceof IdentifierExpression &&
      e.calling.left.value == "math" &&
      e.calling.right instanceof IdentifierExpression
    ) {
      if (operator.mathops.includes(e.calling.right.value as any)) {
        assert(
          e.parameters.length == 1,
          `math.${e.calling.right.value} takes one parameter.`
        );
        let r = cmp(e.parameters[0]);
        return new IRelement(
          r.blocks,
          new MathOp(r.reporter, e.calling.right.value as operator.mathops),
          0
        );
      } else
        throw new Error(`math.${e.calling.right.value} is not a function.`);
    } else {
      assert(
        e.calling instanceof PropertyAccessExpression &&
          e.calling.left instanceof ThisExpression &&
          e.calling.right instanceof IdentifierExpression,
        " Must access `this` when calling a function"
      );
      assert(functions.has(e.calling.right.value), " function not in scope.");
      let fndefinition = functions.get(e.calling.right.value)!;
      // let mp = e.parameters.map((r) => cmp(r));
      locals.scope();
      let z = e.parameters.reduce<Block[]>((r, fm) => {
        let f = cmp(fm);
        locals.push([new LocalVariable("")]);

        return [
          ...r,
          ...f.blocks,
          new InsertIntoList(Locals, f.reporter, new LiteralNumber(1)),
        ];
      }, []);
      locals.pop();

      let call = new FunctionCall(fndefinition, []);
      return new IRelement([...z, call], stackItem(1), 1);
    }
  } else if (e instanceof UnaryExpression) {
    if (e.type == UnaryExpressionType.negative) {
      let r = cmp(e.expression);
      return new IRelement(
        [...r.blocks],
        new Multiply(r.reporter, new LiteralNumber(-1)),
        r.pushes
      );
    } else if (e.type == UnaryExpressionType.not) {
      let r = cmp(e.expression);
      return new IRelement([...r.blocks], new Not(r.reporter), r.pushes);
    }
  }
  console.log(e);
  throw new Error("Unknown expression type ^^");
}
const terminates = (e: Block) => !(e instanceof Forever);
export function Compile(e: SpriteDeclaration) {
  const vmap = new Map<string, Variable>();
  const lmap = new Map<string, List>();
  e.fields.forEach((f) => {
    if (f.list) lmap.set(f.name, new List(f.name, []));
    else vmap.set(f.name, new Variable(f.name));
  });
  let fns = new Map<string, FunctionDefinition>();
  e.functions.forEach((f) => {
    if (f.name != "constructor")
      fns.set(f.name, new FunctionDefinition(f.name, [], []));
  });

  let ctor: Block[] = [];
  e.functions.forEach((f) => {
    let sb: Block[] = [];
    const rootlocals = new BlockManager(
      new BlockAllocation(f.parameters.map((e) => new LocalVariable(e.value))),
      Locals
    );
    f.statements.forEach((s) => {
      if (sb.find((r) => r instanceof StopThisScriot)) return;
      sb.push(
        ...compileStatement(s, {
          variables: vmap,
          functions: fns,
          locals: rootlocals,
          lists: lmap,
        })
      );
    });
    let m = sb.findIndex((e) => e instanceof StopThisScriot);

    if (m == -1 && terminates(sb[sb.length - 1])) {
      sb.push(...rootlocals.top.deAllocAll(Locals));
    } else if (m == sb.length - 1) {
      sb = sb.slice(0, sb.length - 1);
    }
    if (f.name == "constructor") {
      ctor.push(new WhenFlagClicked(sb));
    } else fns.get(f.name)!.statements = sb;
  });

  const m: Sprite = new Sprite(
    e.name,
    Array.from(vmap.values()),
    [...ctor, ...fns.values()],
    Array.from(lmap.values())
  );

  return m.Compile();
}

function compileStatement(
  s: Statement,
  { variables, functions, locals, lists }: CompilationContext
): Block[] {
  let sb: Block[] | undefined = undefined;
  if (s instanceof ExpressionStatement) {
    if (s.expression instanceof AssignmentExpression) {
      let ex = CompileExpr(s.expression.right, {
        variables,
        functions,
        locals,
        lists,
      });

      if (s.expression.left instanceof PropertyAccessExpression) {
        if (!(s.expression.left.right instanceof IdentifierExpression))
          throw new Error("Not identifier");
        if (!variables.has(s.expression.left.right.value))
          throw new Error("Variable does not exist");

        sb = ex.isPure()
          ? [
              new SetVariable(
                variables.get(s.expression.left.right.value)!,
                ex.reporter
              ),
            ]
          : [
              ...ex.blocks,
              new SetVariable(
                variables.get(s.expression.left.right.value)!,
                ex.reporter
              ),
              ...drop(1),
            ];
      } else if (s.expression.left instanceof ArrayAccessExpression) {
        assert(
          s.expression.left.accessing instanceof PropertyAccessExpression,
          " Must access property array. (1)"
        );
        assert(
          s.expression.left.accessing.left instanceof ThisExpression,
          " Must access property on 'this'"
        );
        let arr;
        assert(
          s.expression.left.accessing.left instanceof ThisExpression &&
            s.expression.left.accessing.right instanceof IdentifierExpression,
          " Must access property array."
        );
        assert(
          !!(arr = lists.get(s.expression.left.accessing.right.value)),
          " List not in scope."
        );
        let expr = CompileExpr(s.expression.right, {
          functions,
          lists,
          locals,
          variables,
        });
        let expr2 = CompileExpr(s.expression.left.index, {
          functions,
          lists,
          locals,
          variables,
        });
        let one = undefined;
        let two = undefined;
        let count = 0;
        if (expr.isPure()) {
          one = expr.reporter;
          if (expr2.isPure()) {
            two = expr2.reporter;
          } else {
            count = 1;
            two = stackItem(1);
          }
        } else {
          if (expr2.isPure()) {
            count = 1;
            one = stackItem(1);
            two = expr2.reporter;
          } else {
            count = 2;
            one = stackItem(2);
            two = stackItem(1);
          }
        }

        return [
          ...expr.blocks,
          ...expr2.blocks,
          new ReplaceItemOfList(arr, two, one),
          ...drop(count),
        ];
      } else if (s.expression.left instanceof IdentifierExpression) {
        return locals.top.set(s.expression.left.value, ex).blocks;
      } else throw new Error("Must set property");
    } else {
      let c = CompileExpr(s.expression, {
        variables,
        functions,
        locals,
        lists,
      });

      //   if (c.pushes >= 1) {
      return [...c.blocks, ...drop(c.pushes)];
      //   }
    }
  } else if (s instanceof ReturnStatement) {
    if (s.returns) {
      let r = CompileExpr(s.returns, { variables, functions, locals, lists });

      let m = r.blocks;

      if (r.pushes == 0 && r.isPure()) m = push(r.reporter, 0);

      return [...m, ...locals.top.deAllocAll(Locals), new StopThisScriot()];
    } else {
      return [...locals.top.deAllocAll(Locals), new StopThisScriot()];
    }
  } else if (s instanceof ForeverStatemenet) {
    let _sb: Block[] = [];
    locals.scope();
    s.statements.forEach((r) => {
      _sb.push(
        ...compileStatement(r, {
          variables,
          functions,
          locals,
          lists,
        })
      );
    });

    let r = locals.pop().blocks;
    _sb.push(...r);
    sb = [new Forever(_sb)];
  } else if (s instanceof IfStatement) {
    locals.scope();

    let cond = CompileExpr(s.condition, {
      variables,
      functions,
      locals,
      lists,
    });
    let _sb: Block[] = [];
    s.iftrue.forEach((r) => {
      _sb.push(
        ...compileStatement(r, {
          variables,
          functions,
          locals,
          lists,
        })
      );
    });

    let r = locals.pop().blocks;
    _sb.push(...r);
    sb = [
      ...cond.blocks,
      new IfElse(cond.reporter, _sb, []),
      ...drop(cond.pushes),
    ];
  } else if (s instanceof IfElseStatement) {
    let cond = CompileExpr(s.condition, {
      variables,
      functions,
      locals,
      lists,
    });
    let _sb: Block[] = [];
    let _sb1: Block[] = [];
    s.iftrue.forEach((r) => {
      _sb.push(
        ...compileStatement(r, {
          variables,
          functions,
          locals,
          lists,
        })
      );
    });
    s.ifalse.forEach((r) => {
      _sb1.push(
        ...compileStatement(r, {
          variables,
          functions,
          locals,
          lists,
        })
      );
    });
    sb = [
      ...cond.blocks,
      new IfElse(cond.reporter, _sb, _sb1),
      ...drop(cond.pushes),
    ];
  } else if (s instanceof LetStatement) {
    let e = CompileExpr(s.initializer, { variables, functions, locals, lists });
    locals.push([new LocalVariable(s.name)]);
    return e.isPure()
      ? [new InsertIntoList(Locals, e.reporter, new LiteralNumber(1))]
      : [
          ...e.blocks,
          new InsertIntoList(Locals, e.reporter, new LiteralNumber(1)),
          ...drop(e.pushes),
        ];
  } else if (s instanceof RepeatStatement) {
    let r = CompileExpr(s.times, { variables, functions, locals, lists });
    let st = s.statements.reduce<Block[]>(
      (e, m) => [
        ...e,
        ...compileStatement(m, { variables, functions, locals, lists }),
      ],
      []
    );
    if (r.isPure()) {
      return [new Repeat(r.reporter, st)];
    } else {
      return [...r.blocks, new Repeat(r.reporter, st), ...drop(r.pushes)];
    }
  }
  if (!sb) {
    console.log(s);
    throw new Error("ERROR CANNOT COMPILE BLOCK TYPE ^^");
  }
  return sb;
}
