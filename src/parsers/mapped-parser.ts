import { Parser } from "./index";
import { IParser, OnParse } from "./interfaces";

/**
 * A parser that transforms the output of a parent parser using a mapping function.
 * @typeParam A - The input type.
 * @typeParam B - The parent parser's output type.
 * @typeParam B2 - The mapped output type.
 */
export class MappedAParser<A, B, B2> implements IParser<A, B2> {
  constructor(
    readonly parent: Parser<A, B>,
    readonly map: (value: B) => B2,
    readonly mappingName = map.name,
    readonly description = {
      name: "Mapped",
      children: [parent],
      extras: [mappingName],
    } as const,
  ) {}
  /**
   * Parses the input through the parent, then maps the result.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The mapped value on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const map = this.map;
    try {
      const result = this.parent.enumParsed(a);
      if ("error" in result) {
        return onParse.invalid(result.error);
      }

      return onParse.parsed(map(result.value));
    } catch (error) {
      return onParse.invalid({
        keys: [String(error)],
        parser: this,
        value: a,
      });
    }
  }
}
