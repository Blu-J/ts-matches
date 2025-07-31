import { Description, IParser, OnParse } from "./interfaces";
import { isString } from "./utils";

const NAME = "String";
export class StringParser implements IParser<unknown, string> {
  constructor(
    readonly description = {
      name: NAME,
      children: [],
      extras: [],
    } as const,
  ) {}
  fromDescription(description: Description): IParser<unknown, string> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new StringParser(description as typeof this.description);
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, string, C, D>): C | D {
    if (isString(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
