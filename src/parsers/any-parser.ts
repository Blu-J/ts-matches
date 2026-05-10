import { IParser, OnParse } from "./interfaces";

/**
 * A parser that accepts any value without validation.
 * Always succeeds and returns the input value unchanged.
 */
export class AnyParser implements IParser<unknown, any> {
  constructor(
    readonly description = {
      name: "Any",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Parses any input value, always succeeding.
   * @param a - The input value (any type).
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value (always success).
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, any, C, D>): C | D {
    return onParse.parsed(a);
  }
}
