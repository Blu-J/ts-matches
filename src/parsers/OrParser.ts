import { IParser, OnParse } from "./interfaces";

export class OrParsers<A, A2, B, B2> implements IParser<A | A2, B | B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly otherParser: IParser<A2, B2>,
    readonly name: string = `${parent.name}||${otherParser.name}`
  ) {}
  parse<C, D>(a: A & A2, onParse: OnParse<A | A2, B | B2, C, D>): C | D {
    const otherParser = this.otherParser;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value);
      },
      invalid(previousError) {
        return otherParser.parse(a, {
          parsed(value) {
            return onParse.parsed(value);
          },
          invalid(error) {
            error.name = `${previousError.name}||${error.name}`;
            return onParse.invalid(error);
          },
        });
      },
    });
  }
}
