import { Parser, every, isArray, literal } from ".";
import { IParser, OnParse, ParserInto } from "./interfaces";
import { isShape } from "./ShapeParser";

// prettier-ignore
export type TupleParserInto<T> =
  T extends [infer A] | readonly [infer A] ? [ParserInto<A>]
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? [ParserInto<A>, ...TupleParserInto<B>]
  : never

export class TupleParser<A extends unknown[]> implements IParser<unknown, any> {
  constructor(
    readonly description = {
      name: "Any",
      children: [],
      extras: [],
    } as const
  ) {}
  parse<C, D>(a: unknown, onParse: OnParse<unknown, any, C, D>): C | D {
    return onParse.parsed(a);
  }
}

export function tuple<A extends Parser<unknown, unknown>[]>(
  ...parsers: A
): Parser<unknown, TupleParserInto<A>> {
  const tupleParse = every(
    isArray,
    isShape({ ...parsers, length: literal(parsers.length) } as any)
  );
  // return new Parser(new TupleParser());
  return tupleParse.map((x: any) => Array.from(x)) as any;
}
