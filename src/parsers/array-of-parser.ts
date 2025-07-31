import { Parser } from "./index";
import { Description, IParser, OnParse } from "./interfaces";

/**
 * Given an object, we want to make sure the key exists and that the value on
 * the key matches the parser
 * Note: This will mutate the value sent through
 */
export class ArrayOfParser<B> implements IParser<unknown, B[]> {
  static of<B>(parser: Parser<unknown, B>) {
    return new ArrayOfParser({
      name: "ArrayOf",
      children: [parser],
      extras: [],
    });
  }
  constructor(
    readonly description: {
      name: "ArrayOf";
      children: [Parser<unknown, B>];
    } & Description,
  ) {}
  parse<C, D>(a: unknown, onParse: OnParse<unknown, B[], C, D>): C | D {
    if (!Array.isArray(a)) {
      return onParse.invalid({
        value: a,
        keys: [],
        parser: this,
      });
    }
    const values = [...a];
    const parser = this.description.children[0];
    for (let index = 0; index < values.length; index++) {
      const result = parser.enumParsed(values[index]);
      if ("error" in result) {
        result.error.keys.push("" + index);
        return onParse.invalid(result.error);
      } else {
        values[index] = result.value;
      }
    }
    return onParse.parsed(values as any);
  }
  fromDescription(description: Description) {
    if (description === this.description) {
      return this;
    }
    if (description.name !== "ArrayOf") {
      throw new Error(`The description sent in is invalid type`);
    }

    const [parser] = description.children;
    if (!Parser.isParser(parser)) {
      throw new Error(`The parser sent in is invalid type`);
    }
    return new ArrayOfParser({
      ...description,
      children: [parser] as const,
    });
  }
}
/**
 * We would like to validate that all of the array is of the same type
 * @param validator What is the validator for the values in the array
 */
export function arrayOf<A>(
  validator: Parser<unknown, A>,
): Parser<unknown, A[]> {
  const parser = ArrayOfParser.of(validator);
  const arrayParser = new Parser(parser) as Parser<unknown, A[]>;
  return arrayParser;
}
