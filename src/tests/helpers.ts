import matches from "../matches";
import { any, every, Parser, shape } from "../parsers/index";
import { saferStringify } from "../utils";

/**
 * Assert that a serialized value matches the expected string snapshot.
 */
export function assertSnapshot(expected: string, actual: any) {
  expect(saferStringify(actual)).toEqual(expected);
}

/**
 * Type-level check: ensures `_x` is of type `T` at compile time.
 */
export function isType<T>(_x: T) {}

/**
 * Validator for error objects produced during parsing.
 */
export const validatorError = every(
  shape({
    parser: matches.object,
    keys: matches.arrayOf(matches.string),
    value: any,
  }),
);

/**
 * Unfolds Either results: returns the parsed value or the error string.
 */
export const unFold = {
  invalid: Parser.validatorErrorAsString,
  parsed: (x: any): any => x,
};

/**
 * Folds Either results: wraps invalid values in "invalid(...)" and parsed in "parsed(...)".
 */
export const stringFold = {
  invalid: (x: any): any => `invalid(${saferStringify(x)})`,
  parsed: (x: any): any => `parsed(${saferStringify(x)})`,
};
