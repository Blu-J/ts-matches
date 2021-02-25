import { Parser, isArray } from ".";
import { IParser, OnParse } from "./interfaces";
import { identity } from "./utils";

/**
 * Given an object, we want to make sure the key exists and that the value on
 * the key matches the parser
 * Note: This will mutate the value sent through
 */
export class ArrayOfParser<A extends unknown[], B> implements IParser<A, B[]> {
  constructor(
    readonly parser: IParser<A[number], B>,
    readonly name: string = `${parser.name}[]`
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B[], C, D>): C | D {
    const values = [...a];
    for (let index = 0; index < values.length; index++) {
      const error = this.parser.parse(values[index], {
        parsed(value) {
          values[index] = value;
          return false as const;
        },
        invalid: identity,
      });
      if (!!error) {
        let keys = error.keys || [];
        keys.push(index);
        error.keys = keys;
        error.parser = this.parser;
        return onParse.invalid(error);
      }
    }
    return onParse.parsed(values as any);
  }
}
/**
 * We would like to validate that all of the array is of the same type
 * @param validator What is the validator for the values in the array
 */
export function arrayOf<A>(
  validator: Parser<unknown, A>
): Parser<unknown, A[]> {
  return isArray.concat(new ArrayOfParser(validator));
}
