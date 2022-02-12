import { isNumber } from "./index.ts";
import { IParser, OnParse } from "./interfaces.ts";

export class NumberParser implements IParser<unknown, number> {
  constructor(
    readonly description = {
      name: "Number",
      children: [],
      extras: [],
    } as const,
  ) {}
  parse<C, D>(a: unknown, onParse: OnParse<unknown, number, C, D>): C | D {
    if (isNumber(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
