import { Left, Right, Either } from "./either";

export { Left, Right, Either };

const isObject = (x: unknown): x is object =>
  typeof x === "object" && x !== null;
const isFunctionTest = (x: unknown): x is Function => typeof x === "function";
const isNumber = (x: unknown): x is number => typeof x === "number";


export type ValidatorFn<A> = (value: unknown) => Either<string, A>;
export interface Validator<A> {
  (value: unknown): Either<string, A>;
  unsafeCast(value: unknown): A;
  /**
   * We want to refine to a new type given an original type, like isEven, or casting to a more
   * specific type
   */
  refine<B>(
    refinementTest: (value: A | B) => value is B,
    named?: string
  ): Validator<B>;
  refine(refinementTest: (value: A) => boolean, named?: string): Validator<A>;
}
const identity = <X>(x: X) => x;
const noop = () => void 0;
export function unsafeMatchThrow<A>(validatorFn: ValidatorFn<A>) {
  const unsafeMatch = (value: unknown): A => {
    const matched = validatorFn(value);
    return matched.fold<A>({
      left: error => {
        throw new Error(`Failed to enforce type: ${error}`);
      },
      right: identity
    });
  };
  return unsafeMatch;
}

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
          ? Right.of(valueA)
          : Left.of(`failed ${failureName}(${(valueA)})`)
    );
  return toValidator(validateRefinement);
}

function toValidator<A>(
  validate: (value: unknown) => Either<string, A>
): Validator<A> {
  return Object.assign(validate, {
    unsafeCast: unsafeMatchThrow(validate),
    refine(typeCheck: (value: A) => boolean, failureName = typeCheck.name) {
      return refinementMatch(validate, typeCheck, failureName);
    }
  });
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
        const run = validator(value[key]);
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
    fnTest(value)
      ? Right.of(value)
      : Left.of(`failed ${testName}(${(value)})`);

  return toValidator(isValidEither);
}

export const any = guard(() => true);

export function literal<A extends string | number | boolean | null | undefined>(
  isEqualToValue: A
) {
  return guard<A>(
    (a): a is A => a === isEqualToValue,
    `literal[${(isEqualToValue)}]`
  );
}

export const regex = guard<RegExp>(
  (x): x is RegExp => x instanceof RegExp,
  "regex"
);

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
      const result = fnTest(value);
      result.fold({
        left: value => {
          errors.push(value);
        },
        right: noop
      });
    });
    if (errors.length < args.length) {
      return Right.of(value);
    }
    return Left.of(`fail some(${errors.join(", ")})`);
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
  const validateIntersection: ValidatorFn<unknown> = value => {
    const errors: string[] = [];
    args.forEach(fnTest => {
      const result = fnTest(value);
      result.fold({
        left: value => {
          errors.push(value);
        },
        right: noop
      });
    });
    if (errors.length === 0) {
      return Right.of(value);
    }
    return Left.of(`fail every(${errors.join(", ")})`);
  };
  return toValidator(validateIntersection);
}
export const isPartial = <A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> }
): Validator<Partial<A>> => {
  const validatePartial: ValidatorFn<Partial<A>> = value => {
    if (!isObject(value)) {
      return Left.of(`notAnObject(${(value)})`);
    }
    const shapeMatched = shapeMatch(testShape, value);
    if (shapeMatched.validationErrors.length === 0) {
      return Right.of(value);
    }
    return Left.of(
      `fail partial(${shapeMatched.validationErrors.map(
        ([key, error]) => `@${key} -> ${error}`
      )})`
    );
  };
  return toValidator(validatePartial);
};
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
) => {
  const validateShape: ValidatorFn<A> = value => {
    if (!isObject(value)) {
      return Left.of(`notAnObject(${(value)})`);
    }
    const shapeMatched = shapeMatch(testShape, value);
    if (shapeMatched.validationErrors.length > 0) {
      return Left.of(
        `validationErrors(${shapeMatched.validationErrors
          .map(([key, error]) => `@${key} -> ${error}`)
          .join(", ")})`
      );
    }
    if (shapeMatched.missing.length > 0) {
      return Left.of(`missing(${shapeMatched.missing.join(", ")})`);
    }
    return Right.of(value as A);
  };
  return toValidator(validateShape);
};

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
    isArray(value)
      .map(x => Array.from(x))
      .chain(currentArray => {
        const lefts: [string, number][] = Array.from(currentArray)
          .map(validator)
          .reduce(
            (acc, either, i) =>
              either.fold({
                left: error => {
                  acc.push([error, i]);
                  return acc;
                },
                right: () => acc
              }),
            [] as [string, number][]
          );
        if (lefts.length > 0) {
          return Left.of(
            `validationErrors(${lefts
              .map(([left, index]) => `@${index} -> ${left}`)
              .join(", ")}`
          );
        }
        return Right.of(value as A[]);
      })
  );
}
export interface ChainMatches<OutcomeType> {
  when<B>(
    test: Validator<B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType>;
  defaultTo(value: OutcomeType): OutcomeType;
  defaultToLazy(getValue: () => OutcomeType): OutcomeType;
}

class Matched<OutcomeType> implements ChainMatches<OutcomeType> {
  constructor(private value: OutcomeType) {}
  when<B>(
    fnTest: Validator<B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType> {
    return this as ChainMatches<OutcomeType>;
  }
  defaultTo(defaultValue: OutcomeType) {
    return this.value;
  }
  defaultToLazy(getValue: () => OutcomeType): OutcomeType {
    return this.value;
  }
}

// tslint:disable-next-line:max-classes-per-file
class MatchMore<OutcomeType> implements ChainMatches<OutcomeType> {
  constructor(private a: unknown) {}

  when<B>(
    toValidEither: Validator<B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType> {
    const testedValue = toValidEither(this.a);
    return testedValue.fold<ChainMatches<OutcomeType>>({
      left: () => this,
      right: value => new Matched<OutcomeType>(thenFn(value))
    });
  }

  defaultTo(value: OutcomeType) {
    return value;
  }

  defaultToLazy(getValue: () => OutcomeType): OutcomeType {
    return getValue();
  }
}

/**
 * Want to be able to bring in the declarative nature that a functional programming
 * language feature of the pattern matching and the switch statement. With the destructors
 * the only thing left was to find the correct structure then move move forward.
 * Using a structure in chainable fashion allows for a syntax that works with typescript
 * while looking similar to matches statements in other languages
 *
 * Use: matches('a value').when(matches.isNumber, (aNumber) => aNumber + 4).defaultTo('fallback value')
 */

export const matches = Object.assign(
  function matchesFn<Result>(value: unknown) {
    return new MatchMore<Result>(value);
  },
  {
    array: isArray,
    arrayOf,
    some,
    tuple,
    regex,
    number,
    natural,
    isFunction,
    object,
    string,
    shape,
    partial,
    literal,
    every,
    guard,
    any,
    boolean,
    nill: isNill
  }
);
export default matches;
