import { IParser, OnParse } from "./interfaces";

/**
 * A parser that validates whether a value is an array.
 * Does not validate array element types — use `arrayOf` for typed arrays.
 */
export class ArrayParser implements IParser<unknown, Array<unknown>> {
  constructor(
    readonly description = {
      name: "Array",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Validates that the input is an array.
   * @param a - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed array on success, or an error on failure.
   */
  parse<C, D>(
    a: unknown,
    onParse: OnParse<unknown, Array<unknown>, C, D>,
  ): C | D {
    if (Array.isArray(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
