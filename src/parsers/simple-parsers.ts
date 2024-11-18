import { Parser, shape } from "./index";
import { AnyParser } from "./any-parser";
import { ArrayParser } from "./array-parser";
import { BoolParser } from "./bool-parser";
import { FunctionParser } from "./function-parser";
import { NilParser } from "./nill-parser";
import { NumberParser } from "./number-parser";
import { ObjectParser } from "./object-parser";
import { StringParser } from "./string-parser";
import { UnknownParser } from "./unknown-parser";
import { MergeAll, WithOptionalKeys } from "./shape-parser";
/**
 * Create a custom type guard
 * @param test A function that will determine runtime if the value matches
 * @param testName A name for that function, useful when it fails
 */
export function guard<A, B extends A>(
  test: (value: A) => value is B,
  testName?: string
): Parser<A, B> {
  return Parser.isA(test, testName || test.name);
}

export const any = new Parser(new AnyParser());

export const unknown = new Parser(new UnknownParser());

export const number = new Parser(new NumberParser());

export const isNill = new Parser(new NilParser());

export const natural = number.refine(
  (x: number): x is number => x >= 0 && x === Math.floor(x)
);

export const isFunction = new Parser(new FunctionParser());

export const boolean = new Parser(new BoolParser());

const objectMatcher = new Parser(new ObjectParser());
// deno-lint-ignore ban-types
export function object<A extends {}>(testShape: {
  [key in keyof A]: Parser<unknown, A[key]>;
}): Parser<unknown, WithOptionalKeys<A>>;

export function object(): typeof objectMatcher;
export function object(...args: any[]) {
  if (args.length === 1) return shape(args[0]);
  return objectMatcher;
}

// : typeof shape & Parser<unknown, object> = Object.assign(
//   // deno-lint-ignore no-explicit-any
//   function objectOf(...args: any[]) {

//     // deno-lint-ignore no-explicit-any
//     return (shape as any)(...args);
//   },
//   objectMatcher
//   // deno-lint-ignore no-explicit-any
// ) as any;

export const isArray = new Parser(new ArrayParser());

export const string = new Parser(new StringParser());
export const instanceOf = <C>(classCreator: {
  // deno-lint-ignore no-explicit-any
  new (...args: any[]): C;
}): Parser<unknown, C> =>
  guard((x): x is C => x instanceof classCreator, `is${classCreator.name}`);

export const regex = (tester: RegExp) =>
  string.refine(function (x: string): x is string {
    return tester.test(x);
  }, tester.toString());
