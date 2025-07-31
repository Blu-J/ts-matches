import { Description, IParser, OnParse } from "./interfaces";

const DESCRIPTION = {
  name: "Boolean",
  children: [],
  extras: [],
} as const;
export class BoolParser implements IParser<unknown, boolean> {
  readonly description = DESCRIPTION;
  constructor() {}
  fromDescription(description: Description): IParser<unknown, boolean> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== DESCRIPTION.name) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new BoolParser();
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, boolean, C, D>): C | D {
    if (a === true || a === false) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
