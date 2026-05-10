import { IParser, OnParse } from "./interfaces";
import { isFunctionTest } from "./utils";

/**
 * A parser that validates whether a value is a function.
 */
export class FunctionParser implements IParser<unknown, Function> {
  constructor(
    readonly description = {
      name: "Function",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Validates that the input is a function.
   * @param a - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed function on success, or an error on failure.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, Function, C, D>): C | D {
    if (isFunctionTest(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
