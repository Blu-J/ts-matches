import { Parser } from "./index";
import { Description, IParser, OnParse } from "./interfaces";

const NAME = "Mapped";
export class MappedAParser<A, B, B2> implements IParser<A, B2> {
  static of<A, B, B2>(
    parent: Parser<A, B>,
    map: (value: B) => B2,
    mappingName = map.name,
  ) {
    return new MappedAParser({
      name: NAME,
      children: [parent],
      extras: [map, mappingName],
    });
  }
  constructor(
    readonly description: {
      name: typeof NAME;
      children: [Parser<A, B>];
      extras: [(value: B) => B2, string];
    },
  ) {}
  get map(): (value: B) => B2 {
    return this.description.extras[0];
  }

  get mappingName(): string {
    return this.description.extras[1];
  }

  get parent(): Parser<A, B> {
    return this.description.children[0];
  }
  fromDescription(description: Description): IParser<A, B2> {
    if (this.description === description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new MappedAParser(description as typeof this.description);
  }
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const map = this.map;
    try {
      const result = this.parent.enumParsed(a);
      if ("error" in result) {
        return onParse.invalid(result.error);
      }

      return onParse.parsed(map(result.value));
    } catch (error) {
      return onParse.invalid({
        keys: [String(error)],
        parser: this,
        value: a,
      });
    }
  }
}
