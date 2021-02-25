import { Parser } from ".";
import { EnsureParser, OrParser } from "./interfaces";

// prettier-ignore
export type SomeParsers<T> =
  T extends [infer A] | readonly [infer A] ? EnsureParser<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? OrParser<A, SomeParsers<B>>
  : never
/**
 * Union is a good tool to make sure that the validated value
 * is in the union of all the validators passed in. Basically an `or`
 * operator for validators.
 */
export function some<
  FirstParser extends Parser<unknown, unknown>,
  RestParsers extends Parser<unknown, unknown>[]
>(
  firstParser: FirstParser,
  ...args: RestParsers
): SomeParsers<[FirstParser, ...RestParsers]> {
  return args.reduce((left, right) => left.orParser(right), firstParser) as any;
}
