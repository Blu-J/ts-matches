import { any } from ".";
import { IParser, OnParse } from "./interfaces";

export class ConcatParsers<A, B, B2> implements IParser<A, B2> {
  readonly name: string = `${this.parent.name} |> ${this.otherParser.name}`;
  private constructor(
    readonly parent: IParser<A, B>,
    readonly otherParser: IParser<B, B2>
  ) {}
  static of<A, B, B2>(parent: IParser<A, B>, otherParser: IParser<B, B2>) {
    if (parent === any) {
      return otherParser;
    }
    if (otherParser === any) {
      return parent;
    }
    return new ConcatParsers(parent, otherParser);
  }
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const { otherParser, parent } = this;
    return parent.parse(a, {
      parsed(value) {
        return otherParser.parse(value, {
          parsed(value) {
            return onParse.parsed(value);
          },
          invalid(error) {
            error.name = `${parent.name} |> ${error.name}`;
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
