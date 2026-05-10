import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

/**
 * A parser that retries parsing with a fallback value when the parent parser fails.
 * Unlike `onMismatch`, this re-runs the parent parser on the fallback value
 * (providing a second chance to validate).
 * @typeParam A - The input type.
 * @typeParam B - The parent parser's output type.
 */
export class WithRetry<A, B> implements IParser<unknown, B> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: (a: unknown) => A,
    readonly description = {
      name: "WithRetry" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  /**
   * Parses the input, retrying with the fallback value on failure.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error on failure.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, B, C, D>): C | D {
    const parentCheck = this.parent.enumParsed(a as any);
    if ("error" in parentCheck) {
      const parentCheckTwice = this.parent.enumParsed(this.defaultValue(a));
      if ("error" in parentCheckTwice)
        return onParse.invalid(parentCheck.error);
      return onParse.parsed(parentCheckTwice.value as any);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
