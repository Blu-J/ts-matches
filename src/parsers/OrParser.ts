import { IParser, OnParse } from "./interfaces";

export class OrParsers<A, A2, B, B2> implements IParser<A | A2, B | B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly otherParser: IParser<A2, B2>,
    readonly description = {
      name: "Or",
      children: [parent, otherParser],
      extras: [],
    } as const
  ) {}
  parse<C, D>(a: A & A2, onParse: OnParse<A | A2, B | B2, C, D>): C | D {
    const otherParser = this.otherParser;
    const parser = this;
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
            error.parser = parser;
            return onParse.invalid(error);
          },
        });
      },
    });
  }
}
