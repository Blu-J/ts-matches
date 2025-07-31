import { Description, IParser, OnParse } from "./interfaces";
import { isObject } from "./utils";

const NAME = "Object";
export class ObjectParser implements IParser<unknown, object> {
  constructor(
    readonly description = {
      name: NAME,
      children: [],
      extras: [],
    } as const,
  ) {}
  fromDescription(description: Description): IParser<unknown, object> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new ObjectParser(description as typeof this.description);
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, object, C, D>): C | D {
    if (isObject(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
