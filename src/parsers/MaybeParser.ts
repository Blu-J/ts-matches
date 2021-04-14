import { IParser, Optional, OnParse } from "./interfaces";
export class MaybeParser<A, B> implements IParser<Optional<A>, Optional<B>> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly name: string = `Optional<${parent.name}>`
  ) {}
  parse<C, D>(a: A, onParse: OnParse<Optional<A>, Optional<B>, C, D>): C | D {
    if (a == null) {
      return onParse.parsed(null);
    }
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value);
      },
      invalid(error) {
        error.name = `optional_${error.name}`;
        return onParse.invalid(error);
      },
    });
  }
}
