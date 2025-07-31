import { every, object, Parser } from "./index";
import { saferStringify } from "../utils";
import { Description, IParser, OnParse } from "./interfaces";
type _<T> = T;
export type MergeAll<T> =
  T extends Array<infer U> ? Array<MergeAll<U>>
  : T extends object ?
    T extends null | undefined | never ?
      T
    : _<{ [k in keyof T]: MergeAll<T[k]> }>
  : T;

const PARTIAL_NAME = "Partial";
const SHAPE_NAME = "Shape";
type Name = typeof PARTIAL_NAME | typeof SHAPE_NAME;
/**
 * Given an object, we want to make sure the key exists and that the value on
 * the key matches the parser
 */
export class ShapeParser<A extends unknown, B> implements IParser<A, B> {
  static of<A, B>(
    parserMap: { [key in keyof B]: Parser<unknown, B[key]> },
    isPartial: boolean,
    parserKeys = Object.keys(parserMap) as Array<
      string & keyof typeof parserMap
    >,
  ) {
    const children = parserKeys.map((key) => parserMap[key]);
    return new ShapeParser({
      name: isPartial ? "Partial" : "Shape",
      children,
      extras: parserKeys,
    });
  }
  constructor(
    readonly description: {
      name: Name;
      children: Array<Parser<unknown, B[keyof B]>>;
      extras: Array<keyof B & string>;
    },
  ) {}
  fromDescription(description: Description): IParser<A, B> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== PARTIAL_NAME && description.name !== SHAPE_NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new ShapeParser(description as typeof this.description);
  }

  get isPartial() {
    return this.description.name === PARTIAL_NAME;
  }

  get parserKeys() {
    return this.description.extras;
  }

  *parserSet() {
    const parserIter = this.description.children[Symbol.iterator]();
    for (const key of this.parserKeys) {
      const { value: parser, done } = parserIter.next();
      if (done) break;
      yield [key, parser] as const;
    }
  }

  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    const parser: IParser<unknown, unknown> = this;
    if (!object.test(a)) {
      return onParse.invalid({
        value: a,
        keys: [],
        parser,
      });
    }
    const { isPartial } = this;
    const parserSet = this.parserSet();
    const value: any = { ...(a as object) };
    if (Array.isArray(a)) {
      value.length = a.length;
    }
    for (const [key, parser] of parserSet) {
      if (key in value) {
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
export const isPartial = <A extends {}>(testShape: {
  [key in keyof A]: Parser<unknown, A[key]>;
}): Parser<unknown, Partial<A>> => {
  return new Parser(ShapeParser.of(testShape, true)) as any;
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

export const isShape = <A extends {}>(testShape: {
  [key in keyof A]: Parser<unknown, A[key]>;
}): Parser<unknown, A> => {
  return new Parser(ShapeParser.of(testShape, false)) as any;
};

export type OptionalKeys<Obj extends {}> = {
  [K in keyof Obj]: undefined extends Obj[K] ? K : never;
}[keyof Obj];

export type WithOptionalKeys<Obj extends {}> = MergeAll<
  {
    [K in keyof Omit<Obj, OptionalKeys<Obj>>]: Obj[K];
  } & {
    [K in OptionalKeys<Obj>]?: Obj[K];
  }
>;

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
