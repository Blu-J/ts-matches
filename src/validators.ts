import { Either } from "./either";

import { Maybe } from "./maybe";

const isObject = (x: unknown): x is object =>
  typeof x === "object" && x != null;
const isFunctionTest = (x: unknown): x is Function => typeof x === "function";
const isNumber = (x: unknown): x is number => typeof x === "number";

export type ValidatorFn<A> = (value: unknown) => Either<string, A>;
export type MaybePartial<A> = { [key in keyof A]: Maybe<A[key]> };
export class Validator<A> {
  static of<A>(apply: ((value: unknown) => Either<string, A>)) {
    return new Validator(apply);
  }
  public readonly _TYPE: A = null as any;
  constructor(readonly apply: ValidatorFn<A>) {}
  unsafeCast(value: unknown): A {
    const matched = this.apply(value);
    return matched.fold<A>({
      left: error => {
        throw new TypeError(`Failed type: ${error}`);
      },
      right: identity
    });
  }
  castPromise(value: unknown): Promise<A> {
    return new Promise((resolve, reject) =>
      this.apply(value).fold<void>({ left: reject, right: resolve })
    );
  }

  map<B>(fn: (apply: A) => B): Validator<B> {
    return Validator.of((value: unknown) => this.apply(value).map(fn));
  }

  chain<B>(fn: (apply: A) => Either<string, B>): Validator<B> {
    return Validator.of((value: unknown) => this.apply(value).chain(fn));
  }

  test = (value: unknown): value is A => {
    return this.apply(value).fold({
      left: () => false,
      right: () => true
    });
  };

  /**
   * When we want to make sure that we handle the null later on in a monoid fashion,
   * and this ensures we deal with the value
   */
  maybe(): Validator<Maybe<A>> {
    return maybe(this);
  }
  /**
   * There are times that we would like to bring in a value that we know as null or undefined
   * and want it to go to a default value
   */
  defaultTo(defaultValue: A): Validator<A> {
    return maybe(this).map(maybeA =>
      maybeA.fold({
        some: identity,
        none: () => defaultValue
      })
    );
  }
  /**
   * We want to refine to a new type given an original type, like isEven, or casting to a more
   * specific type
   */
  refine<B>(
    refinementTest: (value: A | B) => value is B,
    named?: string
  ): Validator<B>;
  refine(typeCheck: (value: A) => boolean, failureName?: string): Validator<A>;
  refine(
    typeCheck: (value: A) => boolean,
    failureName = typeCheck.name
  ): Validator<A> {
    return refinementMatch(this.apply, typeCheck, failureName);
  }
}
const identity = <X>(x: X) => x;
const noop = () => void 0;

/**
 * Ensure that we can extend the validator with a more specific validator
 */
export function refinementMatch<A, B extends A>(
  toValidEither: ValidatorFn<A>,
  typeCheck: (a: A | B) => a is B,
  failureName?: string
): Validator<B>;
export function refinementMatch<A>(
  toValidEither: ValidatorFn<A>,
  typeCheck: (a: A) => boolean,
  failureName?: string
): Validator<A>;
export function refinementMatch<A>(
  toValidEither: ValidatorFn<A>,
  typeCheck: (a: A) => boolean,
  failureName = typeCheck.name
) {
  const validateRefinement: ValidatorFn<A> = (value: unknown) =>
    toValidEither(value).chain(
      valueA =>
        typeCheck(valueA)
          ? Either.right(valueA)
          : Either.left(`${failureName}(${valueA})`)
    );
  return toValidator(validateRefinement);
}

function toValidator<A>(
  validate: (value: unknown) => Either<string, A>
): Validator<A> {
  return new Validator(validate);
}

function shapeMatch<A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> },
  value: Partial<A>
) {
  return Object.entries(testShape).reduce<{
    missing: (keyof A)[];
    validationErrors: [keyof A, string][];
  }>(
    (acc, entry) => {
      const key = entry[0] as keyof A;
      const validator = testShape[key];
      if (key in value) {
        const run = validator.apply(value[key]);
        run.fold({
          left: value => {
            acc.validationErrors.push([key, value]);
          },
          right: noop
        });
      } else {
        acc.missing.push(key);
      }
      return acc;
    },
    { missing: [], validationErrors: [] }
  );
}

/**
 * Create a custom type guard
 * @param test A function that will determine runtime if the value matches
 * @param testName A name for that function, useful when it fails
 */
export function guard<A>(
  test: (value: unknown | A) => value is A,
  testName?: string
): Validator<A>;
/**
 * Create a custom validation for new types, or even for any kind of refinements
 * to validations (like an even function)
 * @param test A function that will determine runtime if the value matches
 * @param testName A name for that function, useful when it fails
 */
export function guard(
  test: (value: unknown) => boolean,
  testName?: string
): Validator<unknown>;

export function guard(
  fnTest: (value: unknown) => boolean,
  testName: string = fnTest.name || "test"
): Validator<unknown> {
  const isValidEither: ValidatorFn<unknown> = (value: unknown) =>
    fnTest(value) ? Either.right(value) : Either.left(`${testName}(${value})`);

  return toValidator(isValidEither);
}

export const any = guard(() => true);

export function literal<A extends string | number | boolean | null | undefined>(
  isEqualToValue: A
) {
  return guard<A>(
    (a): a is A => a === isEqualToValue,
    `literal[${isEqualToValue}]`
  );
}

export const number = guard(isNumber);

export const isNill = guard(function isNill(x: unknown): x is null | undefined {
  return x == null;
});

export const natural = number.refine(
  (x: number) => x >= 0 && x === Math.floor(x)
);

// tslint:disable-next-line:no-any Need this for casting any function into shape
export const isFunction = guard<(...args: any[]) => any>(
  (x): x is ((...args: unknown[]) => unknown) => isFunctionTest(x),
  "isFunction"
);

export const boolean = guard<boolean>(
  (x): x is boolean => x === true || x === false,
  "boolean"
);

export const object = guard<object>(isObject);

export const isArray = guard<ArrayLike<unknown>>(Array.isArray);

const isString = (x: unknown): x is string => typeof x === "string";
export const string = guard<string>((x): x is string => isString(x), "string");
export const instanceOf = <C>(classCreator: {
  new (...args: any[]): C;
}): Validator<C> =>
  new Validator(
    (value: unknown) =>
      value instanceof classCreator
        ? Either.right(value)
        : Either.left(`is${classCreator.name}(${value})`)
  );

export const regex = instanceOf(RegExp);
/**
 * Union is a good tool to make sure that the validated value
 * is in the union of all the validators passed in. Basically an `or`
 * operator for validators.
 */
export function some<A, B, C, D>(
  toValidEitherA: Validator<A>,
  toValidEitherB: Validator<B>,
  toValidEitherC: Validator<C>,
  toValidEitherD: Validator<D>
): Validator<A | B | C | D>;

export function some<A, B, C>(
  toValidEitherA: Validator<A>,
  toValidEitherB: Validator<B>,
  toValidEitherC: Validator<C>
): Validator<A | B | C>;

export function some<A, B>(
  toValidEitherA: Validator<A>,
  toValidEitherB: Validator<B>
): Validator<A | B>;

export function some<A>(...args: Validator<A>[]): Validator<A>;

export function some(...args: Validator<unknown>[]): Validator<unknown> {
  const validateUnion: ValidatorFn<unknown> = value => {
    const errors: string[] = [];
    args.forEach(fnTest => {
      const result = fnTest.apply(value);
      result.fold({
        left: value => {
          errors.push(value);
        },
        right: noop
      });
    });
    if (errors.length < args.length) {
      return Either.right(value);
    }
    const uniqueErrors = errors.reduce((acc: string[], value) => {
      if (acc.indexOf(value) === -1) {
        acc.push(value);
      }
      return acc;
    }, []);

    if (uniqueErrors.length === 1) {
      return Either.left(uniqueErrors[0]);
    }
    return Either.left(`some(${uniqueErrors.join(", ")})`);
  };
  return toValidator(validateUnion);
}

/**
 * Intersection is a good tool to make sure that the validated value
 * is in the intersection of all the validators passed in. Basically an `and`
 * operator for validators
 */
export function every<A, B, C, D>(
  toValidEitherA: Validator<A>,
  toValidEitherB: Validator<B>,
  toValidEitherC: Validator<C>,
  toValidEitherD: Validator<D>
): Validator<A & B & C & D>;
export function every<A, B, C>(
  toValidEitherA: Validator<A>,
  toValidEitherB: Validator<B>,
  toValidEitherC: Validator<C>
): Validator<A & B & C>;
export function every<A, B>(
  toValidEitherA: Validator<A>,
  toValidEitherB: Validator<B>
): Validator<A & B>;

export function every<A>(...args: Validator<A>[]): Validator<A>;

export function every(...args: Validator<unknown>[]): Validator<unknown> {
  return Validator.of((value: unknown) =>
    args.reduce((acc, val) => acc.chain(val.apply), Either.right(value))
  );
}

export const isPartial = <A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> }
): Validator<Partial<A>> =>
  object.chain(value => {
    const shapeMatched = shapeMatch(testShape, value);
    if (shapeMatched.validationErrors.length === 0) {
      return Either.right(value);
    }
    const errors = shapeMatched.validationErrors.map(
      ([key, error]) => `@${key} ${error}`
    );
    if (errors.length === 1) {
      return Either.left(errors[0]);
    }
    return Either.left(`(${errors.join(", ")})`);
  });
/**
 * Good for duck typing an object, with optional values
 * @param testShape Shape of validators, to ensure we match the shape
 */
export const partial = <A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> }
): Validator<Partial<A>> => isPartial(testShape);
/**
 * Good for duck typing an object
 * @param testShape Shape of validators, to ensure we match the shape
 */

export const isShape = <A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> }
) =>
  object.chain(value =>
    (Object.keys(testShape) as Array<keyof A>).reduce(
      (shapeEither, key) =>
        shapeEither.chain(shape =>
          testShape[key].apply((value as any)[key]).fold<Either<string, A>>({
            left: l => Either.left(`@${key} ${l}`),
            right: r => {
              shape[key] = r;
              return Either.right(shape);
            }
          })
        ),
      Either.right((Array.isArray(value) ? [...value] : { ...value }) as A)
    )
  );

export const shape = <A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> }
): Validator<A> => isShape(testShape);

export function tuple<A>(tupleShape: [Validator<A>]): Validator<[A]>;

export function tuple<A, B>(
  tupleShape: [Validator<A>, Validator<B>]
): Validator<[A, B]>;

export function tuple<A, B, C>(
  tupleShape: [Validator<A>, Validator<B>, Validator<C>]
): Validator<[A, B, C]>;

export function tuple(tupleShape: ArrayLike<Validator<unknown>>) {
  return every(
    isArray,
    isShape({ ...tupleShape, length: literal(tupleShape.length) })
  );
}

/**
 * We would like to validate that all of the array is of the same type
 * @param validator What is the validator for the values in the array
 */
export function arrayOf<A>(validator: Validator<A>): Validator<A[]> {
  return toValidator(value =>
    isArray
      .apply(value)
      .map(x => Array.from(x))
      .chain(currentArray =>
        currentArray.reduce(
          (accEither: Either<string, A[]>, value: any, i: number) =>
            accEither.chain(acc =>
              validator.apply(value).fold<Either<string, A[]>>({
                left: l => Either.left(`@${i} ${l}`),
                right: r => {
                  acc[i] = r;
                  return Either.right(acc);
                }
              })
            ),
          Either.right(new Array(currentArray.length))
        )
      )
  );
}

export function maybe<A>(validator: Validator<A>): Validator<Maybe<A>> {
  return Validator.of(function maybe(x: unknown) {
    if (x == null) {
      return Either.right(Maybe.none);
    }
    return validator.apply(x).map(Maybe.some);
  });
}

export interface ChainMatches<OutcomeType> {
  when<B>(
    test: Validator<B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType>;
  defaultTo(value: OutcomeType): OutcomeType;
  defaultToLazy(getValue: () => OutcomeType): OutcomeType;
}
