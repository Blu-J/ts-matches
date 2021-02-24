import { mapToConstant } from "fast-check";
import { saferStringify } from "./utils";

const isObject = (x: unknown): x is object =>
  typeof x === "object" && x != null;
const isFunctionTest = (x: unknown): x is Function => typeof x === "function";
const isNumber = (x: unknown): x is number => typeof x === "number";
const isString = (x: unknown): x is string => typeof x === "string";
const identity = <X>(x: X) => x;
const empty: any[] = [];

export type NonNull<A, B> = A extends null | undefined ? B : A;
export type EnsureParser<P> = P extends IParser<unknown, unknown> ? P : never;
export type ParserInto<P> = P extends IParser<unknown, infer A> ? A : never;
export type ParserFrom<P> = P extends IParser<infer A, unknown> ? A : never;
export type Nil = null | undefined;

export type Optional<A> = A | null | undefined;
export type _<T> = T;

export type ISimpleParsedError = {
  parser: IParser<unknown, unknown>;
  value: any;
  keys?: Array<string | number>;
};
export type ValidatorError = ISimpleParsedError;
export type IParser<A, B> = {
  readonly name: string;
  parse<C, D>(this: IParser<A, B>, a: A, onParse: OnParse<A, B, C, D>): C | D;
};
export type OnParse<A, B, C, D> = {
  parsed(b: B): C;
  invalid(error: ISimpleParsedError): D;
};

export type AndParser<P1, P2> = [P1, P2] extends [
  Parser<infer A1, infer B1>,
  Parser<infer A2, infer B2>
]
  ? Parser<A1 & A2, B1 & B2>
  : never;

export type OrParser<P1, P2> = [P1, P2] extends [
  Parser<infer A1, infer B1>,
  Parser<infer A2, infer B2>
]
  ? Parser<A1 | A2, B1 | B2>
  : never;

const booleanOnParse: OnParse<unknown, unknown, true, false> = {
  parsed(_) {
    return true;
  },
  invalid(_) {
    return false;
  },
};

export class IsAParser<A, B> implements IParser<A, B> {
  constructor(
    readonly checkIsA: (value: A) => value is A & B,
    readonly name: string = checkIsA.name
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    if (this.checkIsA(a)) {
      return onParse.parsed(a);
    }
    return onParse.invalid({
      parser: this,
      value: a,
    });
  }
}
export class MappedAParser<A, B, B2> implements IParser<A, B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly map: (value: B) => B2,
    readonly name: string = map.name
      ? `${parent.name}|>${map.name}`
      : parent.name
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const map = this.map;
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(map(value));
      },
      invalid(error) {
        error.parser = parser;
        return onParse.invalid(error);
      },
    });
  }
}
export class ConcatParsers<A, B, B2> implements IParser<A, B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly otherParser: IParser<B, B2>,
    readonly name: string = `${parent.name}|>${otherParser.name}`
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B2, C, D>): C | D {
    const { otherParser, parent, name } = this;
    const parser = this;
    return parent.parse(a, {
      parsed(value) {
        return otherParser.parse(value, {
          parsed(value) {
            return onParse.parsed(value);
          },
          invalid(error) {
            error.parser = parser;
            return onParse.invalid(error);
          },
        });
      },
      invalid(error) {
        return onParse.invalid(error);
      },
    });
  }
}
export class OrParsers<A, A2, B, B2> implements IParser<A | A2, B | B2> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly otherParser: IParser<A2, B2>,
    readonly name: string = `${parent.name}||${otherParser.name}`
  ) {}
  parse<C, D>(a: A & A2, onParse: OnParse<A | A2, B | B2, C, D>): C | D {
    const otherParser = this.otherParser;
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value);
      },
      invalid(_) {
        return otherParser.parse(a, {
          parsed(value) {
            return onParse.parsed(value);
          },
          invalid(error) {
            error.parser = parser;
            return onParse.invalid(error);
          },
        });
      },
    });
  }
}

export class MaybeParser<A, B> implements IParser<Optional<A>, Optional<B>> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly name: string = `Optional<${parent.name}>`
  ) {}
  parse<C, D>(a: A, onParse: OnParse<Optional<A>, Optional<B>, C, D>): C | D {
    if (a == null) {
      return onParse.parsed(null);
    }
    const parser = this;
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value);
      },
      invalid(error) {
        error.parser = parser;
        return onParse.invalid(error);
      },
    });
  }
}
export class DefaultParser<A, B, B2>
  implements IParser<Optional<A>, NonNull<B, B2>> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly defaultValue: B2,
    readonly name: string = `${parent.name}[default:${defaultValue}]`
  ) {}
  parse<C, D>(
    a: A,
    onParse: OnParse<Optional<A>, NonNull<B, B2>, C, D>
  ): C | D {
    const defaultValue = this.defaultValue;
    const parser = this;
    if (a == null) {
      return onParse.parsed(defaultValue as any);
    }
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value as any);
      },
      invalid(error) {
        error.parser = parser;
        return onParse.invalid(error);
      },
    });
  }
}

export class Parser<A, B> implements IParser<A, B> {
  readonly name = this.parser.name;
  public readonly _TYPE: B = null as any;
  constructor(readonly parser: IParser<A, B>) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    return this.parser.parse(a, onParse);
  }
  public static isA<A, B extends A>(
    checkIsA: (value: A) => value is B,
    name?: string
  ): Parser<A, B> {
    return new Parser(new IsAParser(checkIsA, name));
  }

  /**
   * This is the line of code that could be over written if
   * One would like to have a custom error as any shape
   */

  public static validatorErrorAsString = <A, B>(
    error: ISimpleParsedError
  ): string => {
    const { parser, value } = error;

    const keysString =
      "keys" in error && error.keys
        ? `@${error.keys.reverse().map(saferStringify).join(",")}`
        : "";
    return `${parser.name}${keysString}(${saferStringify(value)})`;
  };
  unsafeCast(value: A): B {
    return this.parse(value, {
      parsed: identity,
      invalid(error) {
        throw new TypeError(
          `Failed type: ${Parser.validatorErrorAsString(
            error
          )} given input ${saferStringify(value)}`
        );
      },
    });
  }
  castPromise(value: A): Promise<B> {
    return new Promise((resolve, reject) =>
      this.parse(value, {
        parsed: resolve,
        invalid(error) {
          reject(
            new TypeError(
              `Failed type: ${Parser.validatorErrorAsString(
                error
              )} given input ${saferStringify(value)}`
            )
          );
        },
      })
    );
  }

  map<C>(fn: (apply: B) => C, mappingName?: string): Parser<A, C> {
    return new Parser(new MappedAParser(this, fn, mappingName));
  }

  concat<C>(otherParser: IParser<B, C>, otherName?: string): Parser<A, C> {
    return new Parser(new ConcatParsers(this, otherParser, otherName));
  }

  orParser<C>(
    otherParser: IParser<A, C>,
    otherName?: string
  ): Parser<A, B | C> {
    return new Parser(new OrParsers(this, otherParser, otherName));
  }

  test = (value: A): value is A & B => {
    return this.parse(value, booleanOnParse);
  };

  /**
   * When we want to make sure that we handle the null later on in a monoid fashion,
   * and this ensures we deal with the value
   */
  optional(name?: string): Parser<Optional<A>, Optional<B>> {
    return new Parser(new MaybeParser(this, name));
  }
  /**
   * There are times that we would like to bring in a value that we know as null or undefined
   * and want it to go to a default value
   */
  defaultTo<C>(
    defaultValue: C,
    name?: string
  ): Parser<Optional<A>, C | NonNull<B, C>> {
    return new Parser(
      new DefaultParser(new MaybeParser(this, this.name), defaultValue, name)
    );
  }
  /**
   * We want to refine to a new type given an original type, like isEven, or casting to a more
   * specific type
   */
  refine<C = B>(
    refinementTest: (value: B) => value is B & C,
    named?: string
  ): Parser<A, B & C> {
    return new Parser(
      new ConcatParsers(this, new IsAParser(refinementTest, named))
    );
  }
}

/**
 * Create a custom type guard
 * @param test A function that will determine runtime if the value matches
 * @param testName A name for that function, useful when it fails
 */
export function guard<A, B extends A>(
  test: (value: A) => value is B,
  testName?: string
): Parser<A, B> {
  return Parser.isA(test, testName);
}

export const any = guard((a: unknown): a is any => true, "any");

export function literal<A extends string | number | boolean | null | undefined>(
  isEqualToValue: A
) {
  return guard<unknown, A>(
    (a): a is A => a === isEqualToValue,
    `literal[${saferStringify(isEqualToValue)}]`
  );
}

export type OneOf<T> = T extends [infer A] | readonly [infer A]
  ? A
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B]
  ? A | OneOf<B>
  : never;
export function literals<
  A extends string | number | boolean | null | undefined,
  Rest extends Array<string | number | boolean | null | undefined>
>(firstValue: A, ...restValues: Rest): Parser<unknown, A | OneOf<Rest>> {
  let answer = literal(firstValue);
  return restValues.reduce<Parser<unknown, unknown>>(
    (answer, nextLiteral) => answer.orParser(literal(nextLiteral)),
    answer
  ) as any;
}

export const number = guard(isNumber);

export const isNill = guard(function isNill(x: unknown): x is null | undefined {
  return x == null;
});

export const natural = number.refine(
  (x): x is number => x >= 0 && x === Math.floor(x)
);

export const isFunction = guard<unknown, (...args: any[]) => any>(
  (x): x is (...args: unknown[]) => unknown => isFunctionTest(x),
  "isFunction"
);

export const boolean = guard(
  (x): x is boolean => x === true || x === false,
  "boolean"
);

export const object = guard(isObject);

export const isArray = guard<unknown, ArrayLike<unknown>>(Array.isArray);

export const string = guard((x): x is string => isString(x), "string");
export const instanceOf = <C>(classCreator: {
  new (...args: any[]): C;
}): Parser<unknown, C> =>
  guard((x): x is C => x instanceof classCreator, `is${classCreator.name}`);

export const regex = (regex: RegExp) =>
  string.refine(function matchRegularExpression(x): x is string {
    return regex.test(x);
  });

// prettier-ignore
export type SomeParsers<T> =
  T extends [infer A] | readonly [infer A] ? EnsureParser<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? OrParser<A, SomeParsers<B>>
  : never
/**
 * Union is a good tool to make sure that the validated value
 * is in the union of all the validators passed in. Basically an `or`
 * operator for validators.
 */
export function some<
  FirstParser extends Parser<unknown, unknown>,
  RestParsers extends Parser<unknown, unknown>[]
>(
  firstParser: FirstParser,
  ...args: RestParsers
): SomeParsers<[FirstParser, ...RestParsers]> {
  return args.reduce((left, right) => left.orParser(right), firstParser) as any;
}

// prettier-ignore
export type EveryParser<T> =
  T extends [infer A] | readonly [infer A] ? EnsureParser<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? AndParser<A, EveryParser<B>>
  : never
/**
 * Intersection is a good tool to make sure that the validated value
 * is in the intersection of all the validators passed in. Basically an `and`
 * operator for validators
 */
export function every<
  FirstParser extends Parser<unknown, unknown>,
  RestParsers extends Parser<unknown, unknown>[]
>(
  firstParser: FirstParser,
  ...parsers: RestParsers
): EveryParser<[FirstParser, ...RestParsers]> {
  return parsers.reduce(
    (left, right) => left.concat(right),
    firstParser
  ) as any;
}

export type DictionaryTuple<A> = A extends [
  Parser<unknown, infer Keys>,
  Parser<unknown, infer Values>
]
  ? Keys extends string | number
    ? { [key in Keys]: Values }
    : never
  : never;
// prettier-ignore
export type DictionaryShaped<T> =
  T extends [infer A] | readonly [infer A] ? DictionaryTuple<A>
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? DictionaryTuple<A> & DictionaryShaped<B>
  : never
export class DictionaryParser<
  A extends object | {},
  Parsers extends Array<[Parser<unknown, unknown>, Parser<unknown, unknown>]>
> implements IParser<A, DictionaryShaped<Parsers>> {
  constructor(
    readonly parsers: Parsers,
    readonly name: string = `{${parsers
      .map(
        ([keyType, value]) => `${saferStringify(keyType.name)}: ${value.name}`
      )
      .join(",")}}`
  ) {}
  parse<C, D>(
    a: A,
    onParse: OnParse<A, DictionaryShaped<Parsers>, C, D>
  ): C | D {
    const { parsers } = this;
    const parser = this;
    const answer: any = { ...a };
    for (const key in a) {
      let parseError: false | ISimpleParsedError = false;
      for (const [keyParser, valueParser] of parsers) {
        parseError = keyParser.parse(key, {
          parsed(newKey: string | number) {
            return valueParser.parse((a as any)[key], {
              parsed(newValue) {
                delete answer[key];
                answer[newKey] = newValue;
                return false as const;
              },
              invalid: identity,
            });
          },
          invalid: identity,
        });
        if (!parseError) break;
      }
      if (!!parseError) {
        parseError.parser = parser;
        const keys = parseError.keys || [];
        keys.push(key);
        parseError.keys = keys;
        return onParse.invalid(parseError);
      }
    }

    return onParse.parsed(answer);
  }
}
export const dictionary = <
  FirstParserSet extends [Parser<unknown, unknown>, Parser<unknown, unknown>],
  RestParserSets extends [Parser<unknown, unknown>, Parser<unknown, unknown>][]
>(
  firstParserSet: FirstParserSet,
  ...restParserSets: RestParserSets
): Parser<
  unknown,
  _<DictionaryShaped<[FirstParserSet, ...RestParserSets]>>
> => {
  return object.concat(
    new DictionaryParser([firstParserSet, ...restParserSets])
  ) as any;
};

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

// prettier-ignore
export type TupleParserInto<T> =
  T extends [infer A] | readonly [infer A] ? [ParserInto<A>]
  : T extends [infer A, ...infer B] | readonly [infer A, ...infer B] ? [ParserInto<A>, ...TupleParserInto<B>]
  : never

export function tuple<A extends Parser<unknown, unknown>[]>(
  parsers: A
): Parser<unknown, TupleParserInto<A>> {
  const tupleParse = every(
    isArray,
    isShape({ ...parsers, length: literal(parsers.length) } as any)
  );
  return tupleParse.map((x) => Array.from(x)) as any;
}

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

export interface ChainMatches<OutcomeType> {
  when<B>(
    test: Parser<unknown, B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType>;
  defaultTo(value: OutcomeType): OutcomeType;
  defaultToLazy(getValue: () => OutcomeType): OutcomeType;
}

export const validatorError = every(
  shape({
    parser: shape({
      name: string,
    }),
    value: any,
  }),
  partial({ index: number, key: string })
);
