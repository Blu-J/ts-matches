import { Parser } from ".";
import { EnsureParser, AndParser } from "./interfaces";

// prettier-ignore
export type EveryParser<T> =
  T extends [infer A] | readonly [infer A] ? EnsureParser<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? AndParser<A, EveryParser<B>>
  : never
/**
 * Intersection is a good tool to make sure that the validated value
 * is in the intersection of all the validators passed in. Basically an `and`
 * operator for validators
 */
export function every<
  FirstParser extends Parser<unknown, unknown>,
  RestParsers extends Parser<unknown, unknown>[]
>(
  firstParser: FirstParser,
  ...parsers: RestParsers
): EveryParser<[FirstParser, ...RestParsers]> {
  return parsers.reduce(
    (left, right) => left.concat(right),
    firstParser
  ) as any;
}
