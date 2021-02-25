import { IParser, OnParse } from "./interfaces";

export class ConcatParsers<A, B, B2> implements IParser<A, B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly otherParser: IParser<B, B2>,
    readonly name: string = `${parent.name}|>${otherParser.name}`
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const { otherParser, parent, name } = this;
    const parser = this;
    return parent.parse(a, {
      parsed(value) {
        return otherParser.parse(value, {
          parsed(value) {
            return onParse.parsed(value);
          },
          invalid(error) {
            error.parser = parser;
            return onParse.invalid(error);
          },
        });
      },
      invalid(error) {
        return onParse.invalid(error);
      },
    });
  }
}
