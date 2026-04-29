import { isArray, literal, Parser } from "./index";
import { saferStringify } from "../utils";
import { IParser, OnParse, ParserInto } from "./interfaces";

/**
 * Extracts the tuple type from an array of parsers.
 * @typeParam T - An array of parsers.
 * @returns The resulting tuple type.
 */
export type TupleParserInto<T> =
  T extends [infer A] | readonly [infer A] ? [ParserInto<A>]
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ?
    [ParserInto<A>, ...TupleParserInto<B>]
  : never;

/**
 * A parser that validates fixed-length tuples with specific types per position.
 * @typeParam A - An array of parsers for each tuple position.
 */
export class TupleParser<A extends Parser<unknown, unknown>[]>
  implements IParser<unknown, TupleParserInto<A>>
{
  constructor(
    readonly parsers: A,
    readonly lengthMatcher = literal(parsers.length),
    readonly description = {
      name: "Tuple",
      children: parsers,
      extras: [],
    } as const,
  ) {}
  /**
   * Parses the input as a tuple, validating length and each element.
   * @param input - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed tuple on success, or an error on failure.
   */
  parse<C, D>(
    input: unknown,
    onParse: OnParse<unknown, TupleParserInto<A>, C, D>,
  ): C | D {
    const tupleError = isArray.enumParsed(input);
    if ("error" in tupleError) return onParse.invalid(tupleError.error);
    const values = input as unknown[];
    const stateCheck = this.lengthMatcher.enumParsed(values.length);
    if ("error" in stateCheck) {
      stateCheck.error.keys.push(saferStringify("length"));
      return onParse.invalid(stateCheck.error);
    }
    const answer = new Array(this.parsers.length);
    for (const key in this.parsers) {
      const parser = this.parsers[key];
      const value = values[key];
      const result = parser.enumParsed(value);
      if ("error" in result) {
        const { error } = result;
        error.keys.push(saferStringify(key));
        return onParse.invalid(error);
      }
      answer[key] = result.value;
    }
    return onParse.parsed(answer as any);
  }
}

/**
 * Creates a tuple parser that validates fixed-length arrays with specific types per position.
 *
 * @example
 * ```ts
 * const point = tuple(number, number);
 * const result = point.unsafeCast([1, 2]); // [1, 2]
 * ```
 *
 * @typeParam A - An array of parsers for each tuple position.
 * @param parsers - The parsers for each tuple position.
 * @returns A Parser for the tuple type.
 */
export function tuple<A extends Parser<unknown, unknown>[]>(
  ...parsers: A
): Parser<unknown, TupleParserInto<A>> {
  return new Parser(new TupleParser(parsers));
}
