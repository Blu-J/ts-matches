/**
 * Parser class for handling and processing data parsing operations.
 * This class implements the IParser interface and provides functionality
 * for parsing various types of data with customizable behavior.
 *
 * @example
 * ```typescript
 * const parser = new Parser();
 * const result = parser.parse("some input data");
 * ```
 */
import { Description, IParser, OnParse } from "./interfaces";
const NAME = "Null";
export class NilParser implements IParser<unknown, null | undefined> {
  constructor(
    readonly description = {
      name: NAME,
      children: [],
      extras: [],
    } as const,
  ) {}
  fromDescription(
    description: Description,
  ): IParser<unknown, null | undefined> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new NilParser(description as typeof this.description);
  }
  parse<C, D>(
    a: unknown,
    onParse: OnParse<unknown, null | undefined, C, D>,
  ): C | D {
    if (a === null || a === undefined) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
