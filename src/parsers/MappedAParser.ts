import { IParser, OnParse } from "./interfaces";

export class MappedAParser<A, B, B2> implements IParser<A, B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly map: (value: B) => B2,
    readonly mappingName = map.name,
    readonly description = {
      name: "Mapped",
      children: [],
      extras: [mappingName],
    } as const
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const map = this.map;
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(map(value));
      },
      invalid(error) {
        return onParse.invalid(error);
      },
    });
  }
}
