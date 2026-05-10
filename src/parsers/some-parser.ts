import { Parser } from "./index";
import { EnsureParser, IParser, OrParser } from "./interfaces";
import { any } from "./simple-parsers";

/**
 * Extracts the union type from an array of parsers.
 * @typeParam T - An array of parsers.
 * @returns The union type of all parser outputs.
 */
export type SomeParsers<T> =
  T extends [] | readonly [] ? IParser<unknown, any>
  : T extends [infer A] | readonly [infer A] ? EnsureParser<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ?
    OrParser<A, SomeParsers<B>>
  : T extends Array<infer A> | ReadonlyArray<infer A> ? A
  : never;

/**
 * Creates a parser that validates a value against one of the provided parsers (union/OR).
 * The value must pass at least one parser to be considered valid.
 *
 * @example
 * ```ts
 * const stringOrNumber = some(string, number);
 * const result = stringOrNumber.unsafeCast("hello"); // "hello"
 * ```
 *
 * @typeParam RestParsers - The parsers to union.
 * @param parsers - The parsers to combine with OR logic.
 * @returns A parser that validates against any of the input parsers.
 */
export function some<RestParsers extends Parser<unknown, unknown>[]>(
  ...parsers: RestParsers
): SomeParsers<RestParsers> {
  if (parsers.length <= 0) {
    return any as any;
  }
  const first = parsers.splice(0, 1)[0];
  return parsers.reduce((left, right) => left.orParser(right), first) as any;
}
