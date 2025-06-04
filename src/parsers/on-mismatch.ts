import { Parser } from ".";
import { IParser, OnParse } from "./interfaces";

export class OnMismatch<A, B, B2 extends DeepReadonly<B>>
  implements IParser<A, B>
{
  constructor(
    readonly parent: Parser<A, B>,
    readonly defaultValue: (a: A) => B2,
    readonly description = {
      name: "OnMismatch" as const,
      children: [parent],
      extras: [defaultValue],
    } as const,
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parentCheck = this.parent.enumParsed(a);
    if ("error" in parentCheck) {
      return onParse.parsed(this.defaultValue(a) as any as B);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
