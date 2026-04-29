import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

/**
 * A parser that validates using one of two parsers (union/OR).
 * Tries the parent parser first, then falls back to the other parser.
 * @typeParam A - The first input type.
 * @typeParam A2 - The second input type.
 * @typeParam B - The first output type.
 * @typeParam B2 - The second output type.
 */
export class OrParsers<A, A2, B, B2> implements IParser<A | A2, B | B2> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly otherParser: Parser<A2, B2>,
    readonly description = {
      name: "Or",
      children: [parent, otherParser],
      extras: [],
    } as const,
  ) {}
  /**
   * Parses the input using the parent parser, falling back to the other parser.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error on failure.
   */
  parse<C, D>(a: A & A2, onParse: OnParse<A | A2, B | B2, C, D>): C | D {
    const parser = this;
    const parent = this.parent.enumParsed(a);
    if ("value" in parent) {
      return onParse.parsed(parent.value);
    }
    const other = this.otherParser.enumParsed(a);
    if ("error" in other) {
      const { error } = other;
      error.parser = parser;
      return onParse.invalid(error);
    }
    return onParse.parsed(other.value);
  }
}
