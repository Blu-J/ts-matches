import { Either, Right, Left } from "./either";

import { Maybe, Some, None } from "./maybe";
import matches from "./matches";
import { saferStringify } from "./utils";

const isObject = (x: unknown): x is object =>
  typeof x === "object" && x != null;
const isFunctionTest = (x: unknown): x is Function => typeof x === "function";
const isNumber = (x: unknown): x is number => typeof x === "number";
const isString = (x: unknown): x is string => typeof x === "string";
const identity = <X>(x: X) => x;
const noop = () => void 0;

export type ValidatorError = {
  children: ValidatorError[];
  name: string;
  value?: unknown;
};

export type ValidatorFn<A> = (value: unknown) => Either<ValidatorError, A>;
export type MaybePartial<A> = { [key in keyof A]: Maybe<A[key]> };
export class Validator<A> {
  static of<A>(apply: (value: unknown) => Either<ValidatorError, A>) {
    return new Validator<A>((x) => apply(x).map((name) => name, "left"));
  }
  /**
   * This is the line of code that could be over written if
   * One would like to have a custom error as a string   *
   */

  public static validatorErrorAsString = (
    validationError: ValidatorError
  ): string => {
    const children = (validationError.children || []).map((x) =>
      Validator.validatorErrorAsString(x)
    );
    if ("value" in validationError) {
      children.push(saferStringify(validationError.value));
    }
    return `${validationError.name}(${children.join(", ")})`;
  };
  public readonly _TYPE: A = null as any;
  constructor(readonly apply: ValidatorFn<A>) {}
  unsafeCast(value: unknown): A {
    const matched = this.apply(value);
    return matched.fold<A>({
      left: (error) => {
        throw new TypeError(
          `Failed type: ${Validator.validatorErrorAsString(
            error
          )} given input ${saferStringify(value)}`
        );
      },
      right: identity,
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

  chain<B>(fn: (apply: A) => Either<ValidatorError, B>): Validator<B> {
    return Validator.of((value: unknown) => this.apply(value).chain(fn));
  }

  test = (value: unknown): value is A => {
    return this.apply(value).fold({
      left: () => false,
      right: () => true,
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
    return maybe(this).map((maybeA) =>
      maybeA.fold({
        some: identity,
        none: () => defaultValue,
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
    toValidEither(value).chain((valueA) =>
      typeCheck(valueA)
        ? Right.of(valueA)
        : Left.of({ children: [], name: failureName, value: valueA })
    );
  return toValidator(validateRefinement);
}

function toValidator<A>(
  validate: (value: unknown) => Either<ValidatorError, A>
): Validator<A> {
  return new Validator(validate);
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
      : Left.of({ name: testName, value, children: [] });

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
  (x): x is (...args: unknown[]) => unknown => isFunctionTest(x),
  "isFunction"
);

export const boolean = guard<boolean>(
  (x): x is boolean => x === true || x === false,
  "boolean"
);

export const object = guard<object>(isObject);

export const isArray = guard<ArrayLike<unknown>>(Array.isArray);

export const string = guard<string>((x): x is string => isString(x), "string");
export const instanceOf = <C>(classCreator: {
  new (...args: any[]): C;
}): Validator<C> =>
  new Validator((value: unknown) =>
    value instanceof classCreator
      ? Right.of(value)
      : Left.of({ children: [], name: `is${classCreator.name}`, value })
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
  const validateUnion: ValidatorFn<unknown> = (value) => {
    const errors: ValidatorError[] = [];
    args.forEach((fnTest) => {
      const result = fnTest.apply(value);
      result.fold({
        left: (value) => {
          errors.push(value);
        },
        right: noop,
      });
    });
    if (errors.length < args.length) {
      return Right.of(value);
    }
    const uniqueErrors = errors.reduce((acc: ValidatorError[], value) => {
      if (!acc.find((x) => x.name === value.name && x.value === value.value)) {
        acc.push(value);
      }
      return acc;
    }, []);

    if (uniqueErrors.length === 1) {
      return Left.of(uniqueErrors[0]);
    }
    return Left.of({ children: uniqueErrors, name: "some" });
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
    args.reduce((acc, val) => acc.chain(val.apply), Right.of(value))
  );
}

export const isPartial = <A extends {}>(
  testShape: { [key in keyof A]: Validator<A[key]> }
): Validator<Partial<A>> =>
  object.chain((value) => {
    let answer: any = { ...value };
    let errors: ValidatorError[] = [];
    for (const key in testShape) {
      if (!(key in value)) {
        continue;
      }
      const tested = testShape[key].apply((value as any)[key]);
      if (tested.value.type === "left") {
        errors.push({ children: [tested.value.value], name: `@${key}` });
      } else {
        answer[key] = tested.value.value;
      }
    }
    if (errors.length > 0) {
      return Left.of({
        children: errors,
        name: "partialShape",
      });
    }
    if (Array.isArray(value)) {
      answer.length = value.length;
      return Right.of(Array.from(answer));
    }
    return Right.of(answer);
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
  object.chain((value) => {
    let answer: any = { ...value };
    let errors: ValidatorError[] = [];
    for (const key of Object.keys(testShape) as Array<keyof typeof testShape>) {
      if (!(key in value)) {
        errors.push({ children: [], name: `hasProperty@${key}` });
      } else {
        const tested = testShape[key].apply((value as any)[key]);
        if (tested.value.type === "left") {
          errors.push({ children: [tested.value.value], name: `@${key}` });
        } else {
          answer[key] = tested.value.value;
        }
      }
    }
    if (errors.length > 0) {
      return Left.of({
        children: errors,
        name: "shape",
      });
    }
    if (Array.isArray(value)) {
      answer.length = value.length;
      return Right.of(Array.from(answer));
    }
    return Right.of(answer);
  });

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
  return toValidator((value) => {
    const arrayValue = isArray.apply(value).map((x) => Array.from(x));
    if (arrayValue.value.type === "left") {
      return arrayValue;
    }
    const arrayValueCorrect = arrayValue.value.value
      .map((x, i) =>
        validator
          .apply(x)
          .map((error) => ({ children: [error], name: `@${i}` }), "left")
      )
      .map((x) => x.value);
    const as: A[] = [];
    const lefts: ValidatorError[] = [];
    arrayValueCorrect.forEach((value) => {
      if (value.type === "left") {
        lefts.push(value.value);
      } else {
        as.push(value.value);
      }
    });
    if (lefts.length > 0) {
      return Left.of({
        children: lefts,
        name: "arrayOf",
      });
    }
    return Right.of(as);
  });
}

export function maybe<A>(validator: Validator<A>): Validator<Maybe<A>> {
  return Validator.of(function maybe(x: unknown) {
    if (x == null) {
      return Right.of(None.of);
    }
    return validator.apply(x).map(Some.of);
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

export const validatorError = every(
  shape({
    children: arrayOf(object).maybe(),
    name: string,
  }),
  partial({ value: any.maybe() })
);
