import { Description, IParser, OnParse } from "./interfaces";
import { isFunctionTest } from "./utils";

const NAME = "Function";
export class FunctionParser implements IParser<unknown, Function> {
  constructor(
    readonly description = {
      name: NAME,
      children: [],
      extras: [],
    } as const,
  ) {}
  fromDescription(description: Description): IParser<unknown, Function> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new FunctionParser(description as typeof this.description);
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, Function, C, D>): C | D {
    if (isFunctionTest(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
