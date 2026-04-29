import { Parser } from "./index";
import { IParser, OnParse } from "./interfaces";

/**
 * A parser that concatenates two parsers sequentially: the first parses the input,
 * then the second parses the output of the first.
 * Optimizes away `Any` parsers (since they are no-ops).
 * @typeParam A - The input type.
 * @typeParam B - The intermediate type (output of the first parser, input of the second).
 * @typeParam B2 - The final output type.
 */
export class ConcatParsers<A, B, B2> implements IParser<A, B2> {
  private constructor(
    readonly parent: Parser<A, B>,
    readonly otherParser: Parser<B, B2>,
    readonly description = {
      name: "Concat",
      children: [parent, otherParser],
      extras: [],
    } as const,
  ) {}
  /**
   * Creates a ConcatParsers instance, optimizing away Any parsers.
   * @param parent - The first (parent) parser.
   * @param otherParser - The second parser to chain.
   * @returns The optimized parser (or a raw ConcatParsers).
   */
  static of<A, B, B2>(parent: Parser<A, B>, otherParser: Parser<B, B2>) {
    if (parent.unwrappedParser().description.name === "Any") {
      return otherParser;
    }
    if (otherParser.unwrappedParser().description.name === "Any") {
      return parent;
    }
    return new ConcatParsers(parent, otherParser);
  }
  /**
   * Parses the input through the parent parser, then through the other parser.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The final parsed value on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const parent = this.parent.enumParsed(a);
    if ("error" in parent) {
      return onParse.invalid(parent.error);
    }
    const other = this.otherParser.enumParsed(parent.value);
    if ("error" in other) {
      return onParse.invalid(other.error);
    }
    return onParse.parsed(other.value);
  }
}
