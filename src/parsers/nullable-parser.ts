import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

/**
 * A parser that allows `null` as a valid input, passing it through unchanged.
 * For non-null values, delegates to the parent parser.
 * @typeParam A - The input type (nullable).
 * @typeParam B - The parent parser's output type.
 */
export class NullableParser<A, B> implements IParser<A | null, B | null> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly description = {
      name: "Nullable",
      children: [parent],
      extras: [],
    } as const,
  ) {}
  /**
   * Parses the input, allowing null to pass through.
   * @param a - The input value (may be null).
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value (or null) on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A | null, B | null, C, D>): C | D {
    if (a === null) {
      return onParse.parsed(null);
    }
    const parser = this;
    const parentState = this.parent.enumParsed(a);
    if ("error" in parentState) {
      const { error } = parentState;

      error.parser = parser;
      return onParse.invalid(error);
    }
    return onParse.parsed(parentState.value);
  }
}
