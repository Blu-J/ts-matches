import { any, Parser } from "./index";
import { AndParser, EnsureParser, IParser } from "./interfaces";

/**
 * Extracts the intersection type from an array of parsers.
 * @typeParam T - An array of parsers.
 * @returns The intersection type of all parser outputs.
 */
export type EveryParser<T> =
  T extends [] | readonly [] ? IParser<unknown, any>
  : T extends [infer A] | readonly [infer A] ? EnsureParser<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ?
    AndParser<A, EveryParser<B>>
  : never;

/**
 * Creates a parser that validates a value against all provided parsers (intersection/AND).
 * The value must pass every parser to be considered valid.
 *
 * @example
 * ```ts
 * const isEvenNumber = every(number, guard((x) => x % 2 === 0, "isEven"));
 * ```
 *
 * @typeParam RestParsers - The parsers to intersect.
 * @param parsers - The parsers to combine with AND logic.
 * @returns A parser that validates against all input parsers.
 */
export function every<RestParsers extends Parser<unknown, unknown>[]>(
  ...parsers: RestParsers
): EveryParser<RestParsers> {
  const filteredParsers = parsers.filter((x) => x !== any);
  if (filteredParsers.length <= 0) {
    return any as any;
  }
  const first = filteredParsers.splice(0, 1)[0];
  return filteredParsers.reduce((left, right) => {
    return left.concat(right);
  }, first) as any;
}
