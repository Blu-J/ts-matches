import { IParser, OnParse } from "./interfaces";

/**
 * A parser that accepts any value and returns it unchanged.
 * Unlike `any`, this parser's output type is `unknown`, making it more type-safe.
 * Useful as a base case for union parsers or when the type is truly unknown.
 */
export class UnknownParser implements IParser<unknown, unknown> {
  constructor(
    readonly description = {
      name: "Unknown",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Parses any input value, always succeeding.
   * @param a - The input value (any type).
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value as `unknown` (always success).
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, unknown, C, D>): C | D {
    return onParse.parsed(a);
  }
}
