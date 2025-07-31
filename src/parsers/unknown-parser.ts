import { Description, IParser, OnParse } from "./interfaces";

export class UnknownParser implements IParser<unknown, unknown> {
  constructor(
    readonly description = {
      name: "Unknown",
      children: [],
      extras: [],
    } as const,
  ) {}
  fromDescription(description: Description): IParser<unknown, unknown> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== "Unknown") {
      throw new Error(`The description sent in is invalid type`);
    }
    return new UnknownParser(description as typeof this.description);
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, unknown, C, D>): C | D {
    return onParse.parsed(a);
  }
}
