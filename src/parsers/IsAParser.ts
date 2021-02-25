import { IParser, OnParse } from "./interfaces";

export class IsAParser<A, B> implements IParser<A, B> {
  constructor(
    readonly checkIsA: (value: A) => value is A & B,
    readonly name: string = checkIsA.name
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    if (this.checkIsA(a)) {
      return onParse.parsed(a);
    }
    return onParse.invalid({
      value: a,
      name: this.name,
    });
  }
}
