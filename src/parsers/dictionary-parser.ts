import { object, Parser } from "./index";
import {
  _,
  IParser,
  ISimpleParsedError,
  OnParse,
  SomeParser,
} from "./interfaces";

export type DictionaryTuple<A> =
  A extends [Parser<unknown, infer Keys>, Parser<unknown, infer Values>] ?
    Keys extends string | number ?
      { [key in Keys]: Values }
    : never
  : never;
export type DictionaryShaped<T> =
  T extends [] | readonly [] ? IParser<unknown, any>
  : T extends [infer A] | readonly [infer A] ? DictionaryTuple<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ?
    DictionaryTuple<A> & DictionaryShaped<B>
  : never;
export class DictionaryParser<
  A extends object | {},
  Parsers extends Array<[Parser<unknown, unknown>, Parser<unknown, unknown>]>,
> implements IParser<A, DictionaryShaped<Parsers>>
{
  constructor(
    readonly parsers: Parsers,
    readonly description = {
      name: "Dictionary" as const,
      children: parsers.reduce(
        (acc: Array<IParser<unknown, unknown>>, [k, v]) => {
          acc.push(k, v);
          return acc;
        },
        [],
      ),
      extras: [],
    } as const,
  ) {}
  parse<C, D>(
    a: A,
    onParse: OnParse<A, DictionaryShaped<Parsers>, C, D>,
  ): C | D {
    const { parsers } = this;
    const parser = this;
    const entries: Array<[string | number, unknown]> = Object.entries(a);

    for (const entry of entries) {
      const [key, value] = entry;

      const found = findOrError<Parsers>(parsers, key, value, parser);

      if (found == undefined) return onParse.parsed(a as any);
      if ("error" in found) return onParse.invalid(found.error);
      entry[0] = found[0].value as string | number;
      entry[1] = found[1].value;
    }
    const answer = Object.fromEntries(entries);
    return onParse.parsed(answer as any);
  }
}
export const dictionary = <
  ParserSets extends [Parser<unknown, unknown>, Parser<unknown, unknown>][],
>(
  ...parsers: ParserSets
): Parser<unknown, _<DictionaryShaped<[...ParserSets]>>> => {
  return object.concat(new DictionaryParser([...parsers])) as any;
};

function findOrError<
  Parsers extends Array<[Parser<unknown, unknown>, Parser<unknown, unknown>]>,
>(parsers: Parsers, key: string | number, value: unknown, parser: SomeParser) {
  let foundError: { error: ISimpleParsedError } | undefined;
  for (const [keyParser, valueParser] of parsers) {
    const enumState = keyParser.enumParsed(key);
    const valueState = valueParser.enumParsed(value);

    if ("error" in enumState) {
      if (!foundError) {
        const { error } = enumState;
        error.parser = parser;
        error.keys.push("" + key);
        foundError = { error };
      }
      continue;
    }
    const newKey = enumState.value as string | number;
    if ("error" in valueState) {
      if (!foundError) {
        const { error } = valueState;
        error.keys.push("" + newKey);
        foundError = { error };
      }
      continue;
    }
    return [enumState, valueState];
  }
  return foundError;
}
