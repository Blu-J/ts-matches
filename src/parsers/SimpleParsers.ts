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
  return Parser.isA(test, testName);
}

export const any = guard((a: unknown): a is any => true, "any");

export function literal<A extends string | number | boolean | null | undefined>(
  isEqualToValue: A
) {
  return guard<unknown, A>(
    (a): a is A => a === isEqualToValue,
    `literal[${saferStringify(isEqualToValue)}]`
  );
}

export function literals<
  A extends string | number | boolean | null | undefined,
  Rest extends Array<string | number | boolean | null | undefined>
>(firstValue: A, ...restValues: Rest): Parser<unknown, A | OneOf<Rest>> {
  let answer = literal(firstValue);
  return restValues.reduce<Parser<unknown, unknown>>(
    (answer, nextLiteral) => answer.orParser(literal(nextLiteral)),
    answer
  ) as any;
}

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

export const regex = instanceOf(RegExp);
