import { Description, IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

const NAME = "Or";
export class OrParsers<A, A2, B, B2> implements IParser<A | A2, B | B2> {
  static of<A, A2, B, B2>(parent: Parser<A, B>, otherParser: Parser<A2, B2>) {
    return new OrParsers({
      name: NAME,
      children: [parent, otherParser],
      extras: [],
    });
  }
  constructor(
    readonly description: {
      name: typeof NAME;
      children: [Parser<A, B>, Parser<A2, B2>];
      extras: [];
    },
  ) {}
  get parent() {
    return this.description.children[0];
  }
  get otherParser() {
    return this.description.children[1];
  }
  fromDescription(description: Description): IParser<A | A2, B | B2> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new OrParsers(description as typeof this.description);
  }
  parse<C, D>(a: A & A2, onParse: OnParse<A | A2, B | B2, C, D>): C | D {
    const parser = this;
    const parent = this.parent.enumParsed(a);
    if ("value" in parent) {
      return onParse.parsed(parent.value);
    }
    const other = this.otherParser.enumParsed(a);
    if ("error" in other) {
      const { error } = other;
      error.parser = parser;
      return onParse.invalid(error);
    }
    return onParse.parsed(other.value);
  }
}
