import { IParser, OnParse } from "./interfaces";

/**
 * A parser that validates using a custom predicate (guard) function.
 * The predicate receives the input value and returns a type guard.
 * @typeParam A - The input type.
 * @typeParam B - The narrowed output type.
 */
export class GuardParser<A, B> implements IParser<A, B> {
  constructor(
    readonly checkIsA: (value: A) => value is A & B,
    readonly typeName: string,
    readonly description = {
      name: "Guard",
      children: [],
      extras: [typeName],
    } as const,
  ) {}
  /**
   * Validates the input using the guard predicate.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    if (this.checkIsA(a)) {
      return onParse.parsed(a);
    }
    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
