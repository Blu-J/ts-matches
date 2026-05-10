import { Parser } from "./index";
import { IParser, OnParse, Optional } from "./interfaces";

/**
 * A parser that allows `undefined` as a valid input, passing it through unchanged.
 * For non-undefined values, delegates to the parent parser.
 * @typeParam A - The input type (optional).
 * @typeParam B - The parent parser's output type.
 */
export class MaybeParser<A, B> implements IParser<Optional<A>, Optional<B>> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly description = {
      name: "Maybe",
      children: [parent],
      extras: [],
    } as const,
  ) {}
  /**
   * Parses the input, allowing undefined to pass through.
   * @param a - The input value (may be undefined).
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value (or undefined) on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<Optional<A>, Optional<B>, C, D>): C | D {
    if (a === undefined) {
      return onParse.parsed(undefined);
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
