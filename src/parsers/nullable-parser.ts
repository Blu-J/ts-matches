import { Description, IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

const NAME = "Nullable";
export class NullableParser<A, B> implements IParser<A | null, B | null> {
  static of<A, B>(parent: Parser<A, B>) {
    return new NullableParser({
      name: NAME,
      children: [parent],
      extras: [],
    });
  }
  constructor(
    readonly description: {
      name: typeof NAME;
      children: [Parser<A, B>];
      extras: [];
    },
  ) {}
  get parent() {
    return this.description.children[0];
  }
  fromDescription(description: Description): IParser<A | null, B | null> {
    const isSameDescription = description === this.description;
    const isInvalidParserType = description.name !== NAME;
    if (isSameDescription) return this;

    if (isInvalidParserType)
      throw new Error(`The description sent in is invalid type`);

    return new NullableParser(description as typeof this.description);
  }
  parse<C, D>(value: A, onParse: OnParse<A | null, B | null, C, D>): C | D {
    if (value === null) {
      return onParse.parsed(null);
    }
    const parentState = this.parent.enumParsed(value);
    if ("error" in parentState) {
      const { error } = parentState;

      error.parser = this;
      return onParse.invalid(error);
    }
    return onParse.parsed(parentState.value);
  }
}
