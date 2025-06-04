import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

export class NullableParser<A, B> implements IParser<A | null, B | null> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly description = {
      name: "Nullable",
      children: [parent],
      extras: [],
    } as const,
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A | null, B | null, C, D>): C | D {
    if (a === null) {
      return onParse.parsed(null);
    }
    const parser = this;
    const parentState = this.parent.enumParsed(a);
    if ("error" in parentState) {
      const { error } = parentState;

      error.parser = parser;
      return onParse.invalid(error);
    }
    return onParse.parsed(parentState.value);
  }
}
