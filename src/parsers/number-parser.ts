import { isNumber } from "./index";
import { Description, IParser, OnParse } from "./interfaces";
const NAME = "Number";
export class NumberParser implements IParser<unknown, number> {
  constructor(
    readonly description = {
      name: NAME,
      children: [],
      extras: [],
    } as const,
  ) {}
  fromDescription(description: Description): IParser<unknown, number> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new NumberParser(description as typeof this.description);
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, number, C, D>): C | D {
    if (isNumber(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
