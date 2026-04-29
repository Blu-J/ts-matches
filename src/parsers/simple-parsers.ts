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
 * Creates a custom type guard parser from a predicate function.
 *
 * @example
 * ```ts
 * const isEven = guard((x): x is number => x % 2 === 0, "isEven");
 * ```
 *
 * @typeParam A - The input type.
 * @typeParam B - The narrowed output type.
 * @param test - A type guard function.
 * @param testName - Optional custom name for error messages.
 * @returns A Parser that validates using the guard.
 */
export function guard<A, B extends A>(
  test: (value: A) => value is B,
  testName?: string,
): Parser<A, B> {
  return Parser.isA(test, testName || test.name);
}

/**
 * A parser that accepts any value without validation.
 */
export const any = new Parser(new AnyParser());

/**
 * A parser that accepts any value and returns it as `unknown`.
 */
export const unknown = new Parser(new UnknownParser());

/**
 * A parser that validates numbers.
 */
export const number = new Parser(new NumberParser());

/**
 * A parser that validates null or undefined.
 */
export const isNill = new Parser(new NilParser());

/**
 * A parser that validates natural numbers (non-negative integers).
 */
export const natural = number.refine(
  (x: number): x is number => x >= 0 && x === Math.floor(x),
);

/**
 * A parser that validates functions.
 */
export const isFunction = new Parser(new FunctionParser());

/**
 * A parser that validates booleans.
 */
export const boolean = new Parser(new BoolParser());

const objectMatcher = new Parser(new ObjectParser());

/**
 * A parser that validates objects, with an additional `shape`-like interface
 * for duck typing.
 */
export const object: typeof shape & Parser<unknown, object> = Object.assign(
  function objectOf(...args: any[]) {
    return (shape as any)(...args);
  },
  objectMatcher,
) as any;

/**
 * A parser that validates arrays.
 */
export const isArray = new Parser(new ArrayParser());

/**
 * A parser that validates strings.
 */
export const string = new Parser(new StringParser());

/**
 * Creates a parser that validates instanceof a specific class.
 *
 * @example
 * ```ts
 * const isDate = instanceOf(Date);
 * ```
 *
 * @typeParam C - The class type.
 * @param classCreator - The class constructor.
 * @returns A Parser that validates instanceof.
 */
export const instanceOf = <C>(classCreator: {
  new (...args: any[]): C;
}): Parser<unknown, C> =>
  guard((x): x is C => x instanceof classCreator, `is${classCreator.name}`);

/**
 * Creates a parser that validates strings against a regex pattern.
 *
 * @example
 * ```ts
 * const emailRegex = regex(/^[^@]+@[^@]+\.[^@]+$/);
 * ```
 *
 * @param tester - The regex pattern to test against.
 * @returns A Parser that validates strings against the regex.
 */
export const regex = (tester: RegExp) =>
  string.refine(function (x: string): x is string {
    return tester.test(x);
  }, tester.toString());
