import { IParser, OnParse } from "./interfaces";

export class MappedAParser<A, B, B2> implements IParser<A, B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly map: (value: B) => B2,
    readonly name: string = map.name
      ? `${parent.name}|>${map.name}`
      : parent.name
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const map = this.map;
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(map(value));
      },
      invalid(error) {
        error.parser = parser;
        return onParse.invalid(error);
      },
    });
  }
}
