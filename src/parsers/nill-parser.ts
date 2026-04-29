import { IParser, OnParse } from "./interfaces";

/**
 * A parser that validates whether a value is `null` or `undefined`.
 */
export class NilParser implements IParser<unknown, null | undefined> {
  constructor(
    readonly description = {
      name: "Null",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Validates that the input is `null` or `undefined`.
   * @param a - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed nullish value on success, or an error on failure.
   */
  parse<C, D>(
    a: unknown,
    onParse: OnParse<unknown, null | undefined, C, D>,
  ): C | D {
    if (a === null || a === undefined) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
