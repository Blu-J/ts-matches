import { every, object, Parser } from "./index";
import { saferStringify } from "../utils";
import { IParser, OnParse } from "./interfaces";
type _<T> = T;

/**
 * Recursively merges array and object types.
 * @typeParam T - The type to merge.
 */
export type MergeAll<T> =
  T extends Array<infer U> ? Array<MergeAll<U>>
  : T extends object ?
    T extends null | undefined | never ?
      T
    : _<{ [k in keyof T]: MergeAll<T[k]> }>
  : T;

/**
 * A parser that validates object shapes against a schema of key-value parsers.
 * Supports both required and optional keys based on the input type.
 * @typeParam A - The input object type.
 * @typeParam Key - The key type (string, number, or symbol).
 * @typeParam B - The expected output object type.
 */
export class ShapeParser<
  A extends unknown,
  Key extends string | number | symbol,
  B,
> implements IParser<A, B>
{
  constructor(
    readonly parserMap: { [key in keyof B]: Parser<unknown, B[key]> },
    readonly isPartial: boolean,
    readonly parserKeys = Object.keys(parserMap) as Array<
      string & keyof typeof parserMap
    >,
    readonly description = {
      name: isPartial ? "Partial" : "Shape",
      children: parserKeys.map((key) => parserMap[key]),
      extras: parserKeys,
    } as const,
  ) {}
  /**
   * Parses the input object against the shape schema.
   * @param a - The input object to validate.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed object on success, or an error on failure.
   */
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parser: IParser<unknown, unknown> = this;
    if (!object.test(a)) {
      return onParse.invalid({
        value: a,
        keys: [],
        parser,
      });
    }
    const { parserMap, isPartial, parserKeys } = this;
    const value: any = { ...(a as object) };
    if (Array.isArray(a)) {
      value.length = a.length;
    }
    for (const key of parserKeys) {
      if (key in value) {
        const parser = parserMap[key as keyof typeof parserMap];
        const state = parser.enumParsed((a as any)[key]);
        if ("error" in state) {
          const { error } = state;
          error.keys.push(saferStringify(key));
          return onParse.invalid(error);
        }
        const smallValue = state.value;
        value[key] = smallValue;
      } else if (!isPartial) {
        return onParse.invalid({
          value: "missingProperty",
          parser,
          keys: [saferStringify(key)],
        });
      }
    }

    return onParse.parsed(value);
  }
}

/**
 * Creates a partial shape parser where all keys are optional.
 *
 * @example
 * ```ts
 * const partialUser = partial({
 *   name: string,
 *   age: number,
 * });
 * const result = partialUser.unsafeCast({ name: "Alice" });
 * ```
 *
 * @typeParam A - The expected shape type.
 * @param testShape - The shape of validators for each key.
 * @returns A Parser for partial objects.
 */
export const isPartial = <A extends {}>(testShape: {
  [key in keyof A]: Parser<unknown, A[key]>;
}): Parser<unknown, Partial<A>> => {
  return new Parser(new ShapeParser(testShape, true)) as any;
};

/**
 * Creates a partial shape parser where all keys are optional.
 * Alias for `isPartial`.
 *
 * @example
 * ```ts
 * const partialUser = partial({
 *   name: string,
 *   age: number,
 * });
 * ```
 *
 * @typeParam A - The expected shape type.
 * @param testShape - The shape of validators for each key.
 * @returns A Parser for partial objects.
 */
export const partial = isPartial;

/**
 * Creates a shape parser where all keys are required.
 * Good for duck typing an object.
 *
 * @example
 * ```ts
 * const user = shape({
 *   name: string,
 *   age: number,
 * });
 * const result = user.unsafeCast({ name: "Alice", age: 30 });
 * ```
 *
 * @typeParam A - The expected shape type.
 * @param testShape - The shape of validators for each key.
 * @returns A Parser for objects matching the shape.
 */
export const isShape = <A extends {}>(testShape: {
  [key in keyof A]: Parser<unknown, A[key]>;
}): Parser<unknown, A> => {
  return new Parser(new ShapeParser(testShape, false)) as any;
};

/**
 * Extracts the keys of an object type that have `undefined` in their type.
 * @typeParam Obj - The object type to inspect.
 */
export type OptionalKeys<Obj extends {}> = {
  [K in keyof Obj]: undefined extends Obj[K] ? K : never;
}[keyof Obj];

/**
 * Computes the type of an object with optional keys properly marked.
 * @typeParam Obj - The object type.
 */
export type WithOptionalKeys<Obj extends {}> = MergeAll<
  {
    [K in keyof Omit<Obj, OptionalKeys<Obj>>]: Obj[K];
  } & {
    [K in OptionalKeys<Obj>]?: Obj[K];
  }
>;

/**
 * Creates a shape parser for validating object structures with required keys
 * and optional keys inferred from the type.
 *
 * Keys whose parsers are "retryable" (Maybe, Unknown, Default, OnMismatch, WithRetry)
 * are treated as optional.
 *
 * @example
 * ```ts
 * const user = shape({
 *   name: string,
 *   age: number.optional(),
 * });
 * const result = user.unsafeCast({ name: "Alice" });
 * ```
 *
 * @typeParam A - The expected shape type.
 * @param testShape - The shape of validators for each key.
 * @returns A Parser for objects matching the shape with optional keys.
 */
export function shape<A extends {}>(testShape: {
  [key in keyof A]: Parser<unknown, A[key]>;
}): Parser<unknown, WithOptionalKeys<A>> {
  const entries = Object.entries(testShape || {}) as Array<
    [keyof A, Parser<unknown, A[keyof A]>]
  >;
  const [full, partials] = entries.reduce(
    ([full, partials], [key, parser]) =>
      parser.retryable() ?
        [full, [...partials, [key, parser]] as typeof entries]
      : [[...full, [key, parser]] as typeof entries, partials],
    [[] as typeof entries, [] as typeof entries],
  );
  if (!partials.length) {
    return isShape(testShape || {}) as any as Parser<
      unknown,
      WithOptionalKeys<A>
    >;
  } else {
    const partialParser = partial(Object.fromEntries(partials)).map((ret) => {
      for (const [key, parser] of partials) {
        const keyAny = key as any;
        if (!(keyAny in ret)) {
          const newValue = parser.unsafeCast(undefined);
          if (newValue !== undefined) {
            ret[keyAny] = newValue;
          }
        }
      }
      return ret;
    });
    if (!full.length) {
      return partialParser as any as Parser<unknown, WithOptionalKeys<A>>;
    } else {
      return every(
        partialParser,
        isShape(Object.fromEntries(full)),
      ) as any as Parser<unknown, WithOptionalKeys<A>>;
    }
  }
}
