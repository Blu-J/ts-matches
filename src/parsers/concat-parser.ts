import { Parser } from "./index";
import { Description, IParser, OnParse } from "./interfaces";

const NAME = "Concat";
/**
 * A parser combinator that combines two parsers into one, applying the first
 * parser to the input and then the second parser to the remaining input. The
 * result of the second parser is returned as the overall result.
 *
 * @typeParam A - The type of the input data that the parser operates on.
 * @typeParam B - The type of the result produced by the first parser.
 * @typeParam C - The type of the result produced by the second parser.
 */
export class ConcatParsers<A, B, B2> implements IParser<A, B2> {
  private constructor(
    readonly description: {
      name: typeof NAME;
      children: [Parser<A, B>, Parser<B, B2>];
      extras: [];
    },
  ) {}
  static of<A, B, B2>(parent: Parser<A, B>, otherParser: Parser<B, B2>) {
    if (parent.unwrappedParser().description.name === "Any") {
      return otherParser;
    }
    if (otherParser.unwrappedParser().description.name === "Any") {
      return parent;
    }
    return new ConcatParsers({
      name: NAME,
      children: [parent, otherParser],
      extras: [],
    });
  }
  fromDescription(description: Description): IParser<unknown, B2> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    const [parent, otherParent] = description.children;
    if (!Parser.isParser(parent) || !Parser.isParser(otherParent)) {
      throw new Error(`The parser sent in is invalid type`);
    }
    return new ConcatParsers(description as typeof this.description);
  }
  get parent(): Parser<A, B> {
    return this.description.children[0];
  }
  get otherParser(): Parser<B, B2> {
    return this.description.children[1];
  }
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const parent = this.parent.enumParsed(a);
    if ("error" in parent) {
      return onParse.invalid(parent.error);
    }
    const other = this.otherParser.enumParsed(parent.value);
    if ("error" in other) {
      return onParse.invalid(other.error);
    }
    return onParse.parsed(other.value);
  }
}
