import { IParser, OnParse } from "./interfaces";
export class NilParser implements IParser<unknown, null | undefined | void> {
  constructor(
    readonly description = {
      name: "Null",
      children: [],
      extras: [],
    } as const
  ) {}
  parse<C, D>(
    a: unknown,
    onParse: OnParse<unknown, null | undefined | void, C, D>
  ): C | D {
    if (a === null || a === undefined) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
