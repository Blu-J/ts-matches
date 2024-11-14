import { Parser } from ".";
import { IParser, Optional, NonNull, OnParse } from "./interfaces";

export class OnMismatch<A, B>
  implements IParser<A, B>
{
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: B,
    readonly description = {
      name: "OnMismatch" as const,
      children: [parent],
      extras: [defaultValue],
    } as const
  ) {}
  parse<C, D>(
    a: A,
    onParse: OnParse<A, B, C, D>
  ): C | D {
    const parentCheck = this.parent.enumParsed(a);
    if ("error" in parentCheck) {
        return onParse.parsed(this.defaultValue)
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
