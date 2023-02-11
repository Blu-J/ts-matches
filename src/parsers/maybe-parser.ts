import { Parser } from "./index.ts";
import { IParser, OnParse, Optional } from "./interfaces.ts";
export class MaybeParser<A, B> implements IParser<Optional<A>, Optional<B>> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly description = {
      name: "Maybe",
      children: [parent],
      extras: [],
    } as const,
  ) {}
  parse<C, D>(a: A, onParse: OnParse<Optional<A>, Optional<B>, C, D>): C | D {
    if (a == null) {
      return onParse.parsed(null);
    }
    // deno-lint-ignore no-this-alias
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
