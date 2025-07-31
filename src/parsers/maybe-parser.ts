import { Parser } from "./index";
import { Description, IParser, OnParse, Optional } from "./interfaces";
const NAME = "Maybe";
export class MaybeParser<A, B> implements IParser<Optional<A>, Optional<B>> {
  static of<A, B>(parent: Parser<A, B>) {
    return new MaybeParser({
      name: NAME,
      children: [parent],
      extras: [],
    });
  }
  constructor(
    readonly description: Description & {
      name: typeof NAME;
      children: [Parser<A, B>];
      extras: [];
    },
  ) {}
  get parent() {
    return this.description.children[0];
  }
  fromDescription(description: Description): IParser<Optional<A>, Optional<B>> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new MaybeParser(description as typeof this.description);
  }
  parse<C, D>(a: A, onParse: OnParse<Optional<A>, Optional<B>, C, D>): C | D {
    if (a === undefined) {
      return onParse.parsed(undefined);
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
