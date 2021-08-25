import { Parser } from ".";
import { IParser, OnParse } from "./interfaces";

export class NamedParser<A, B> implements IParser<A, B> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly name: string,
    readonly description = {
      name: "Named",
      children: [parent],
      extras: [name],
    } as const
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value);
      },
      invalid(error) {
        error.parser = parser;
        return onParse.invalid(error);
      },
    });
  }
}

export function parserName<A, B>(name: string, parent: IParser<A, B>) {
  return new Parser(new NamedParser(parent, name));
}
