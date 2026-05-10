import { Parser } from "./index";
import { IParser, NonNull, OnParse, Optional } from "./interfaces";

/**
 * A parser that provides a default value when the input is `undefined`.
 * If the input is not `undefined`, it passes through the parent parser.
 * @typeParam A - The input type (optional).
 * @typeParam B - The output type of the parent parser.
 * @typeParam B2 - The default value type.
 */
export class DefaultParser<A, B, B2>
  implements IParser<Optional<A>, NonNull<B, B2>>
{
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: B2,
    readonly description = {
      name: "Default" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  /**
   * Parses the input, returning the default value if `undefined`, otherwise passing through.
   * @param a - The input value (may be `undefined`).
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value or default on success, or an error on failure.
   */
  parse<C, D>(
    a: A,
    onParse: OnParse<Optional<A>, NonNull<B, B2>, C, D>,
  ): C | D {
    const parser = this;
    const defaultValue = this.defaultValue;
    if (a === undefined) {
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
