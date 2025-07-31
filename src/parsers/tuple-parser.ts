import { isArray, literal, Parser } from "./index";
import { saferStringify } from "../utils";
import { Description, IParser, OnParse, ParserInto } from "./interfaces";

export type TupleParserInto<T> =
  T extends [infer A] | readonly [infer A] ? [ParserInto<A>]
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ?
    [ParserInto<A>, ...TupleParserInto<B>]
  : never;

const NAME = "Tuple";
export class TupleParser<A extends Parser<unknown, unknown>[]>
  implements IParser<unknown, TupleParserInto<A>>
{
  static of<A extends Parser<unknown, unknown>[]>(
    parsers: A,
    lengthMatcher = literal(parsers.length),
  ) {
    return new TupleParser({
      name: NAME,
      children: parsers,
      extras: [lengthMatcher],
    });
  }
  constructor(
    readonly description: {
      name: typeof NAME;
      children: A;
      extras: [Parser<unknown, number>];
    },
  ) {}
  get lengthMatcher() {
    return this.description.extras[0];
  }
  get parsers() {
    return this.description.children;
  }
  get length(): number {
    return this.parsers.length;
  }
  fromDescription(
    description: Description,
  ): IParser<unknown, TupleParserInto<A>> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new TupleParser(description as typeof this.description);
  }
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

export function tuple<A extends Parser<unknown, unknown>[]>(
  ...parsers: A
): Parser<unknown, TupleParserInto<A>> {
  return new Parser(TupleParser.of(parsers));
}
