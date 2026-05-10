import { OnParse } from "./interfaces";

/**
 * Type guard: checks if a value is an object (not null).
 * @param x - The value to check.
 * @returns True if `x` is a non-null object.
 */
export const isObject = (x: unknown): x is object =>
  typeof x === "object" && x != null;

/**
 * Type guard: checks if a value is a function.
 * @param x - The value to check.
 * @returns True if `x` is a function.
 */
export const isFunctionTest = (x: unknown): x is Function =>
  typeof x === "function";

/**
 * Type guard: checks if a value is a number (including NaN and Infinity).
 * @param x - The value to check.
 * @returns True if `x` is a number.
 */
export const isNumber = (x: unknown): x is number => typeof x === "number";

/**
 * Type guard: checks if a value is a string.
 * @param x - The value to check.
 * @returns True if `x` is a string.
 */
export const isString = (x: unknown): x is string => typeof x === "string";

/**
 * An empty array, useful as a default value.
 */
export const empty: any[] = [];

/**
 * An OnParse callback that returns true for success and false for failure.
 * Useful for the `.test()` method.
 */
export const booleanOnParse: OnParse<unknown, unknown, true, false> = {
  parsed(_) {
    return true;
  },
  invalid(_) {
    return false;
  },
};

/**
 * Extracts the first element type from a tuple/array type.
 * @typeParam T - The tuple/array type.
 */
export type OneOf<T> =
  T extends [infer A] | readonly [infer A] ? A
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ?
    A | OneOf<B>
  : never;
