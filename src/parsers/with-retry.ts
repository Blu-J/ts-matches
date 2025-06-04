import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

export class WithRetry<A, B> implements IParser<unknown, B> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: (a: unknown) => A,
    readonly description = {
      name: "WithRetry" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  parse<C, D>(a: unknown, onParse: OnParse<unknown, B, C, D>): C | D {
    const parentCheck = this.parent.enumParsed(a as any);
    if ("error" in parentCheck) {
      const parentCheckTwice = this.parent.enumParsed(this.defaultValue(a));
      if ("error" in parentCheckTwice)
        return onParse.invalid(parentCheck.error);
      return onParse.parsed(parentCheckTwice.value as any);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
