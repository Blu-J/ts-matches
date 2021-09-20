import { Parser, isArray, literal } from ".";
import {
  tupleStateInvalidValue,
  tupleStateIsInvalid,
  tupleStateValidValue,
} from "../tupleState";
import { saferStringify } from "../utils";
import { IParser, OnParse, ParserInto } from "./interfaces";

// prettier-ignore
export type TupleParserInto<T> =
  T extends [infer A] | readonly [infer A] ? [ParserInto<A>]
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? [ParserInto<A>, ...TupleParserInto<B>]
  : never

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
    } as const
  ) {}
  parse<C, D>(
    input: unknown,
    onParse: OnParse<unknown, TupleParserInto<A>, C, D>
  ): C | D {
    const tupleStateArray = isArray.asTupleState(input);
    if (tupleStateIsInvalid(tupleStateArray))
      return onParse.invalid(tupleStateInvalidValue(tupleStateArray));
    const values = tupleStateValidValue(tupleStateArray);
    const tupleStateLength = this.lengthMatcher.asTupleState(values.length);
    if (tupleStateIsInvalid(tupleStateLength)) {
      const result = tupleStateInvalidValue(tupleStateLength);
      result.keys.push(saferStringify("length"));
      return onParse.invalid(result);
    }
    for (const key in this.parsers) {
      const parser = this.parsers[key];
      const value = values[key];
      const resultTuple = parser.asTupleState(value);
      if (tupleStateIsInvalid(resultTuple)) {
        const result = tupleStateInvalidValue(resultTuple);
        result.keys.push(saferStringify(key));
        return onParse.invalid(result);
      }
    }
    return onParse.parsed(values as any);
  }
}

export function tuple<A extends Parser<unknown, unknown>[]>(
  ...parsers: A
): Parser<unknown, TupleParserInto<A>> {
  return new Parser(new TupleParser(parsers));
}
