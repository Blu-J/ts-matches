import { IParser, Optional, NonNull, OnParse } from "./interfaces";
import { Parser } from "./parser";

/**
 * A parser that provides a default value when the input is `null`.
 * For non-null values, delegates to the parent parser.
 * @typeParam A - The input type (nullable).
 * @typeParam B - The parent parser's output type.
 * @typeParam B2 - The default value type.
 */
export class NullishParsed<A, B, B2>
  implements IParser<A | null, NonNull<B, B2>>
{
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: B2,
    readonly description = {
      name: "Nullable" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  /**
   * Parses the input, returning the default value if null.
   * @param a - The input value (may be null).
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value or default on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A | null, NonNull<B, B2>, C, D>): C | D {
    const parser = this;
    const defaultValue = this.defaultValue;
    if (a === null) {
      return onParse.parsed(defaultValue as any);
    }
    const parentCheck = this.parent.enumParsed(a);
    if ("error" in parentCheck) {
      parentCheck.error.parser = parser;
      return onParse.invalid(parentCheck.error);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
