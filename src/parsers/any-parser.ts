import { Description, IParser, OnParse } from "./interfaces";

export class AnyParser implements IParser<unknown, any> {
  constructor(
    readonly description = {
      name: "Any",
      children: [],
      extras: [],
    } as const,
  ) {}
  parse<C, D>(a: unknown, onParse: OnParse<unknown, any, C, D>): C | D {
    return onParse.parsed(a);
  }
  fromDescription(description: Description) {
    if (description === this.description) {
      return this;
    }
    if (description.name !== "Any") {
      throw new Error(`The description sent in is invalid type`);
    }
    return new AnyParser(description as typeof this.description);
  }
}
