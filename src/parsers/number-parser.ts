import { isNumber } from "./index";
import { IParser, OnParse } from "./interfaces";

/**
 * A parser that validates whether a value is a number (including `NaN` and `Infinity`).
 */
export class NumberParser implements IParser<unknown, number> {
  constructor(
    readonly description = {
      name: "Number",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Validates that the input is a number.
   * @param a - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed number on success, or an error on failure.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, number, C, D>): C | D {
    if (isNumber(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
