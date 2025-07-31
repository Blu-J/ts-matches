import { Parser } from "./index";
import { Description, IParser, OnParse } from "./interfaces";

const NAMED = "Named";
export class NamedParser<A, B> implements IParser<A, B> {
  static of<A, B>(parent: Parser<A, B>, name: string) {
    return new NamedParser({
      name: NAMED,
      children: [parent],
      extras: [name],
    });
  }
  constructor(
    readonly description: {
      name: typeof NAMED;
      children: [Parser<A, B>];
      extras: [string];
    },
  ) {}
  fromDescription(description: Description): IParser<A, B> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAMED) {
      throw new Error(`The description sent in is invalid type`);
    }
    const [parent, otherParent] = description.children;
    if (!Parser.isParser(parent) || !Parser.isParser(otherParent)) {
      throw new Error(`The parser sent in is invalid type`);
    }
    return new NamedParser(description as typeof this.description);
  }
  get parent() {
    return this.description.children[0];
  }
  get name() {
    return this.description.extras[0];
  }
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parser = this;
    const parent = this.parent.enumParsed(a);
    if ("error" in parent) {
      const { error } = parent;
      error.parser = parser;
      return onParse.invalid(error);
    }
    return onParse.parsed(parent.value);
  }
}

export function parserName<A, B>(
  name: string,
  parent: Parser<A, B>,
): Parser<A, B> {
  return new Parser(NamedParser.of(parent, name));
}
