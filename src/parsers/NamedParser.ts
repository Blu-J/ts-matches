import { IParser, OnParse } from "./interfaces";

/**
 * We may want to name our parser
 */
export class NamedParser<A, B> implements IParser<A, B> {
  constructor(readonly parent: IParser<A, B>, readonly name: string) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value);
      },
      invalid(error) {
        error.name = parser.name;
        return onParse.invalid(error);
      },
    });
  }
}
