import { Description, IParser, OnParse } from "./interfaces";

const DESCRIPTION = {
  name: "Array",
  children: [],
  extras: [],
} as const;
export class ArrayParser implements IParser<unknown, Array<unknown>> {
  readonly description = DESCRIPTION;
  constructor() {}
  fromDescription(description: Description): IParser<unknown, unknown[]> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== "Array") {
      throw new Error(`The description sent in is invalid type`);
    }
    return new ArrayParser();
  }
  parse<C, D>(
    a: unknown,
    onParse: OnParse<unknown, Array<unknown>, C, D>,
  ): C | D {
    if (Array.isArray(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
