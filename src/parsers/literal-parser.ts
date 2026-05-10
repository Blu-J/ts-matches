import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";
import { OneOf } from "./utils";

/**
 * Deep equality check for literal values, including NaN and nested objects/arrays.
 */
function eq(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === b.length) {
        return a.findIndex((a, idx) => !eq(a, b[idx])) === -1;
      }
    } else if (a && b && !Array.isArray(a) && !Array.isArray(b)) {
      return eq(
        Object.entries(a).sort(([a, _a], [b, _b]) => a.localeCompare(b)),
        Object.entries(b).sort(([a, _a], [b, _b]) => a.localeCompare(b)),
      );
    }
  }
  return false;
}

/**
 * A parser that validates against multiple literal values.
 * @typeParam B - An array of literal value types.
 */
export class LiteralsParser<B extends unknown[]>
  implements IParser<unknown, OneOf<B>>
{
  constructor(
    readonly values: B,
    readonly description = {
      name: "Literal",
      children: [],
      extras: values,
    } as const,
  ) {}
  /**
   * Validates the input against the literal values.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error on failure.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, OneOf<B>, C, D>): C | D {
    for (const value of this.values) {
      if (eq(value, a)) return onParse.parsed(a as OneOf<B>);
    }

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}

/**
 * Creates a parser that validates an exact literal value.
 *
 * @example
 * ```ts
 * const name = literal("Alice");
 * const result = name.unsafeCast("Alice"); // "Alice"
 * ```
 *
 * @typeParam A - The literal type to match.
 * @param isEqualToValue - The exact value to match.
 * @returns A Parser that validates the literal value.
 */
export function literal<
  A extends
    | string
    | number
    | bigint
    | boolean
    | symbol
    | undefined
    | object
    | null,
>(isEqualToValue: A) {
  return new Parser(new LiteralsParser<[A]>([isEqualToValue]));
}

/**
 * Creates a parser that validates against one of multiple literal values.
 *
 * @example
 * ```ts
 * const status = literals("active", "inactive", "pending");
 * const result = status.unsafeCast("active"); // "active"
 * ```
 *
 * @typeParam A - The first literal type.
 * @typeParam Rest - Additional literal types.
 * @param firstValue - The first literal value.
 * @param restValues - Additional literal values.
 * @returns A Parser that validates one of the literal values.
 */
export function literals<
  A extends
    | string
    | number
    | bigint
    | boolean
    | symbol
    | undefined
    | object
    | null,
  Rest extends Array<
    string | number | bigint | boolean | symbol | undefined | object | null
  >,
>(firstValue: A, ...restValues: Rest): Parser<unknown, A | OneOf<Rest>> {
  return new Parser(new LiteralsParser([firstValue, ...restValues]));
}
