import { IParser, OnParse } from "./interfaces.ts";
import { isString } from "./utils.ts";

export class StringParser implements IParser<unknown, string> {
  constructor(
    readonly description = {
      name: "String",
      children: [],
      extras: [],
    } as const
  ) {}
  parse<C, D>(a: unknown, onParse: OnParse<unknown, string, C, D>): C | D {
    if (isString(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
