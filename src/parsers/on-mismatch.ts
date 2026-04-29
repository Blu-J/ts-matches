import { Parser } from ".";
import { IParser, OnParse } from "./interfaces";

/**
 * A parser that provides a fallback value when the parent parser fails.
 * Unlike `defaultTo`, this applies to all invalid inputs (not just null/undefined).
 * @typeParam A - The input type.
 * @typeParam B - The parent parser's output type.
 * @typeParam B2 - The fallback value type (must be DeepReadonly<B>).
 */
export class OnMismatch<A, B, B2 extends DeepReadonly<B>>
  implements IParser<A, B>
{
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: (a: A) => B2,
    readonly description = {
      name: "OnMismatch" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  /**
   * Parses the input, returning the fallback value on failure.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value or fallback on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parentCheck = this.parent.enumParsed(a);
    if ("error" in parentCheck) {
      return onParse.parsed(this.defaultValue(a) as any as B);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}

/**
 * Recursively makes all properties of a type readonly.
 * @typeParam T - The type to make readonly.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
