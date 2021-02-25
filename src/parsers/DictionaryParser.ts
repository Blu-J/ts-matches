import { object, Parser } from ".";
import { saferStringify } from "../utils";
import { IParser, OnParse, ISimpleParsedError, _ } from "./interfaces";
import { identity } from "./utils";

export type DictionaryTuple<A> = A extends [
  Parser<unknown, infer Keys>,
  Parser<unknown, infer Values>
]
  ? Keys extends string | number
    ? { [key in Keys]: Values }
    : never
  : never;
// prettier-ignore
export type DictionaryShaped<T> =
    T extends [] | readonly [] ? IParser<unknown, any>
    : T extends [infer A] | readonly [infer A] ? DictionaryTuple<A>
    : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? DictionaryTuple<A> & DictionaryShaped<B>
    : never
export class DictionaryParser<
  A extends object | {},
  Parsers extends Array<[Parser<unknown, unknown>, Parser<unknown, unknown>]>
> implements IParser<A, DictionaryShaped<Parsers>> {
  constructor(
    readonly parsers: Parsers,
    readonly name: string = `{${parsers
      .map(
        ([keyType, value]) => `${saferStringify(keyType.name)}: ${value.name}`
      )
      .join(",")}}`
  ) {}
  parse<C, D>(
    a: A,
    onParse: OnParse<A, DictionaryShaped<Parsers>, C, D>
  ): C | D {
    const { parsers } = this;
    const parser = this;
    const answer: any = { ...a };
    for (const key in a) {
      let parseError: Array<ISimpleParsedError> = [];
      for (const [keyParser, valueParser] of parsers) {
        const newError = keyParser.parse(key, {
          parsed(newKey: string | number) {
            return valueParser.parse((a as any)[key], {
              parsed(newValue) {
                delete answer[key];
                answer[newKey] = newValue;
                return false as const;
              },
              invalid(error) {
                error.name = `<value> ${error.name}`;
                return error;
              },
            });
          },
          invalid(error) {
            error.name = `<key> ${error.name}`;
            return error;
          },
        });
        if (newError === false) {
          parseError = [];
          break;
        }
        parseError.push(newError);
      }
      if (parseError.length) {
        return onParse.invalid({
          value: { key: key, value: a[key] },
          name: `${parseError.map((x) => x.name).join(" || ")}`,
        });
      }
    }

    return onParse.parsed(answer);
  }
}
export const dictionary = <
  FirstParserSet extends [Parser<unknown, unknown>, Parser<unknown, unknown>],
  RestParserSets extends [Parser<unknown, unknown>, Parser<unknown, unknown>][]
>(
  firstParserSet: FirstParserSet,
  ...restParserSets: RestParserSets
): Parser<
  unknown,
  _<DictionaryShaped<[FirstParserSet, ...RestParserSets]>>
> => {
  return object.concat(
    new DictionaryParser([firstParserSet, ...restParserSets])
  ) as any;
};
