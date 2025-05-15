import { IParser, Optional, NonNull, OnParse } from "./interfaces";
import { Parser } from "./parser";

export class NullishParsed<A, B, B2>
  implements IParser<A | null, NonNull<B, B2>>
{
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: B2,
    readonly description = {
      name: "Nullable" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A | null, NonNull<B, B2>, C, D>): C | D {
    const parser = this;
    const defaultValue = this.defaultValue;
    if (a === null) {
      return onParse.parsed(defaultValue as any);
    }
    const parentCheck = this.parent.enumParsed(a);
    if ("error" in parentCheck) {
      parentCheck.error.parser = parser;
      return onParse.invalid(parentCheck.error);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
