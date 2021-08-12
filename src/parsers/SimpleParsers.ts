import { Parser } from ".";
import { saferStringify } from "../utils";
import { isFunctionTest, isNumber, isObject, isString, OneOf } from "./utils";

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

export const any = guard((a: unknown): a is any => true, "any");

export const number = guard(isNumber);

export const isNill = guard(function isNill(x: unknown): x is null | undefined {
  return x == null;
});

export const natural = number.refine(
  (x): x is number => x >= 0 && x === Math.floor(x)
);

export const isFunction = guard<unknown, (...args: any[]) => any>(
  (x): x is (...args: unknown[]) => unknown => isFunctionTest(x),
  "isFunction"
);

export const boolean = guard(
  (x): x is boolean => x === true || x === false,
  "boolean"
);

export const object = guard(isObject);

export const isArray = guard<unknown, ArrayLike<unknown>>(Array.isArray);

export const string = guard((x): x is string => isString(x), "string");
export const instanceOf = <C>(classCreator: {
  new (...args: any[]): C;
}): Parser<unknown, C> =>
  guard((x): x is C => x instanceof classCreator, `is${classCreator.name}`);

export const regex = (tester: RegExp) =>
  string.refine(function (x): x is string {
    return tester.test(x);
  }, tester.toString());
