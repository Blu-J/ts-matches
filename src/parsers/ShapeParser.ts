import { Parser, object } from ".";
import { saferStringify } from "../utils";
import { IParser, OnParse } from "./interfaces";

/**
 * Given an object, we want to make sure the key exists and that the value on
 * the key matches the parser
 */
export class ShapeParser<
  A extends object | {},
  Key extends string | number | symbol,
  B
> implements IParser<A, B> {
  constructor(
    readonly parserMap: { [key in keyof B]: Parser<unknown, B[key]> },
    readonly isPartial: boolean,
    readonly name: string = `{${Object.entries(parserMap)
      .map(
        ([key, value]) =>
          `${saferStringify(key)}${isPartial ? "?" : ""}: ${
            (value as Parser<unknown, unknown>).name
          }`
      )
      .join(",")}}`
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, { [key in Key]?: B }, C, D>): C | D {
    const { parserMap, isPartial } = this;
    const parser = this;
    const value: any = { ...a };
    if (Array.isArray(a)) {
      value.length = a.length;
    }
    for (const key in parserMap) {
      if (key in value) {
        const parser = parserMap[key];
        const isValidParse = parser.parse((a as any)[key], {
          parsed(smallValue) {
            value[key] = smallValue;
            return true as const;
          },
          invalid(error) {
            error.parser = parser;
            const keys = error.keys || [];
            keys.push(key);
            error.keys = keys;
            return error;
          },
        });
        if (isValidParse !== true) {
          return onParse.invalid(isValidParse);
        }
      } else if (!isPartial) {
        return onParse.invalid({
          parser,
          value,
          keys: [key],
        });
      }
    }

    return onParse.parsed(value);
  }
}
export const isPartial = <A extends {}>(
  testShape: { [key in keyof A]: Parser<unknown, A[key]> }
): Parser<unknown, Partial<A>> => {
  return object.concat(new ShapeParser(testShape, true)) as any;
};

/**
 * Good for duck typing an object, with optional values
 * @param testShape Shape of validators, to ensure we match the shape
 */
export const partial = isPartial;
/**
 * Good for duck typing an object
 * @param testShape Shape of validators, to ensure we match the shape
 */

export const isShape = <A extends {}>(
  testShape: { [key in keyof A]: Parser<unknown, A[key]> }
): Parser<unknown, A> => {
  return object.concat(new ShapeParser(testShape, false)) as any;
};
export const shape = <A extends {}>(
  testShape: { [key in keyof A]: Parser<unknown, A[key]> }
): Parser<unknown, A> => isShape(testShape);
