import { IParser, OnParse } from "./interfaces";
import { isObject } from "./utils";

/**
 * A parser that validates whether a value is an object (excluding `null`).
 * Note: In JavaScript, `typeof null === "object"`, so `null` is explicitly excluded.
 */
export class ObjectParser implements IParser<unknown, object> {
  constructor(
    readonly description = {
      name: "Object",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Validates that the input is an object (not `null`, not a primitive).
   * @param a - The input value to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed object on success, or an error on failure.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, object, C, D>): C | D {
    if (isObject(a)) return onParse.parsed(a);

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}
