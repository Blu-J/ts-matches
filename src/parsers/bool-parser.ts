import { IParser, OnParse } from "./interfaces";

/**
 * A parser that validates whether a value is a boolean (`true` or `false`).
 * Only exact `true` or `false` values pass; all other values (including `0`, `"false"`, etc.) fail.
 */
export class BoolParser implements IParser<unknown, boolean> {
  constructor(
    readonly description = {
      name: "Boolean",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Validates that the input is strictly `true` or `false`.
   * @param a - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed boolean on success, or an error on failure.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, boolean, C, D>): C | D {
    if (a === true || a === false) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
