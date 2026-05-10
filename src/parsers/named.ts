import { Parser } from "./index";
import { IParser, OnParse } from "./interfaces";

/**
 * A parser that wraps another parser and adds a custom name for error messages.
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 */
export class NamedParser<A, B> implements IParser<A, B> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly name: string,
    readonly description = {
      name: "Named",
      children: [parent],
      extras: [name],
    } as const,
  ) {}
  /**
   * Parses the input through the parent, adding this parser's name to errors.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parser = this;
    const parent = this.parent.enumParsed(a);
    if ("error" in parent) {
      const { error } = parent;
      error.parser = parser;
      return onParse.invalid(error);
    }
    return onParse.parsed(parent.value);
  }
}

/**
 * Wraps a parser with a custom name for error message customization.
 *
 * @example
 * ```ts
 * const namedNumber = parserName("age", number);
 * ```
 *
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 * @param name - The custom name for error messages.
 * @param parent - The parser to wrap.
 * @returns A named Parser.
 */
export function parserName<A, B>(
  name: string,
  parent: Parser<A, B>,
): Parser<A, B> {
  return new Parser(new NamedParser(parent, name));
}
