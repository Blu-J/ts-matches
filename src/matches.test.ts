import matches from "./matches";
import { any, every, Parser, shape, string } from "./parsers/index";
import { saferStringify } from "./utils";
const isNumber = (x: unknown): x is number => typeof x === "number";
class Event {
  constructor(readonly type: string) {}
}
export const validatorError = every(
  shape({
    parser: matches.object,
    keys: matches.arrayOf(matches.string),
    value: any,
  }),
);

export function isType<T>(_x: T) {}
type AssertNever<A> =
  A extends string | number | boolean | object | Function ? A : never;
function assertNeverUnknown<A>(a: AssertNever<A>): A {
  return a;
}
export function assertSnapshot(expected: string, actual: any) {
  expect(saferStringify(actual)).toEqual(expected);
}

const unFold = {
  invalid: Parser.validatorErrorAsString,
  parsed: (x: any): any => x,
};
const stringFold = {
  invalid: (x: any): any => `invalid(${saferStringify(x)})`,
  parsed: (x: any): any => `parsed(${saferStringify(x)})`,
};
test("testing catches", () => {
  const testValue = { a: "c" };
  const left = { left: true };
  const right = { right: true };
  const testMatch = matches.shape({ a: matches.literal("c") });
  const validator = matches(testValue)
    .when(testMatch, () => left)
    .defaultTo(right);
  expect(validator).toEqual(left);
});
test("testing falls through", () => {
  const testValue = { a: "c" };
  const left = { left: true };
  const right = { right: true };
  const testMatch = matches.shape({ a: matches.literal("d") });
  const validator = matches(testValue)
    .when(testMatch, () => left)
    .defaultTo(right);
  expect(validator).toEqual(right);
});
test("testing catches lazy", () => {
  const testValue = { a: 0 };
  const left = { left: true };
  const right = { right: true };
  const testMatch = matches.shape({ a: matches.natural });
  const validator = matches(testValue)
    .when(testMatch, () => left)
    .defaultToLazy(() => right);
  expect(validator).toEqual(left);
});
test("testing falls through lazy", () => {
  const testValue = { a: "c" };
  const left = { left: true };
  const right = { right: true };
  const testMatch = matches.shape({ a: matches.literal("d") });
  const validator: typeof left | typeof right = matches(testValue)
    .when(testMatch, () => left)
    .defaultToLazy(() => right);
  expect(validator).toEqual(right);
});
test("testing can match literal", () => {
  const testValue = 5 as const;
  const value = matches(testValue)
    .when(5, 2 as const)
    .unwrap();
  expect(value).toEqual(2);
});

test("testing can cast literal NaN", () => {
  matches.literal(NaN).unsafeCast(NaN);
});
test("testing can match literal lazy", () => {
  const testValue = 5 as const;
  const value = matches(testValue)
    .when(5, () => 2 as const)
    .unwrap();
  expect(value).toEqual(2);
});
test("testing can match several literals", () => {
  const testValue = 5 as const;
  const value = matches(testValue)
    .when(2, 5, () => 2 as const)
    .unwrap();
  expect(value).toEqual(2);
});
test("unwrap when not matched will throw", () => {
  const testValue = 5 as const;
  try {
    matches(testValue)
      .when(2, () => 2 as const)
      // @ts-expect-error We are expecting that unwrap should not be callable
      .unwrap();
  } catch (_e) {
    return;
  }
  throw new Error("should have thrown");
});
test("default literal", () => {
  expect(matches(5).when("5").unwrap()).toEqual("5");
});
test("default literal for object", () => {
  expect(() =>
    matches({})
      .when(matches.shape({ testing: matches.string }), 6)
      // @ts-expect-error I'm expecting that unwrap is not guarenteed
      .unwrap(),
  ).toThrow();
});
test("testing type inferencing of matching", () => {
  matches(5 as const)
    // @ts-expect-error Error is that 6 is not a subset 2
    .when(2 as const, (_a: 6) => 1 as const)
    .defaultTo(4);
  matches(5 as const)
    // @ts-expect-error Error is that 6 is not a subset 2
    .when(matches.literal(2), (_a: 6) => 2 as const);
  matches(5 as const)
    .when(matches.literal(6), (_a: 6) => 3 as const)
    .when(2, 5, (a: 5 | 2) => a)
    // @ts-expect-error Should be never since all cases are covered
    .when(2, 5, (a: 5 | 2) => a)
    .defaultTo(0);
  matches("test" as const)
    .when("string" as const, "a" as const)
    .when(matches.string, "b" as const)
    // @ts-expect-error Should be never since all cases are covered
    .when(matches.string, "c")
    .defaultTo(0);
  matches("test")
    .when("a")
    // @ts-expect-error Should be never since all cases are covered
    .when("b")
    .defaultTo(0);
  const _answer: "a" | "b" = matches("test")
    .when("string", "a")
    .when(matches.string, () => "b" as const)
    .unwrap();
  const _answer2: "a" = matches("test").when("a").unwrap();
});

test("should be able to test shape", () => {
  const testValue = { a: "c" };
  const validator = matches.shape({ a: matches.literal("c") });
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});
test("should not get an error message for missing key", () => {
  const testValue = { a: "c" };
  const validator = matches.shape({ a: matches.any });
  const message = validator.errorMessage(testValue);
  expect(message).toEqual(undefined);
});

test("should fail for missing key", () => {
  const testValue = {};
  const validator = matches.shape({ a: matches.any });
  assertSnapshot(
    '"[\\"a\\"]Shape<{a:any}>(\\"missingProperty\\")"',
    validator.parse(testValue, unFold),
  );
});
test("should get an error message for missing key", () => {
  const testValue = {};
  const validator = matches.shape({ a: matches.any });
  const message = validator.errorMessage(testValue);
  assertSnapshot('"[\\"a\\"]Shape<{a:any}>(\\"missingProperty\\")"', message);
});

test("should be able to test shape with failure", () => {
  const testValue = { a: "c" };
  const validator = matches.shape({ a: matches.literal("b") });
  assertSnapshot(
    '"[\\"a\\"]Literal<\\"b\\">(\\"c\\")"',
    validator.parse(testValue, unFold),
  );
});

test("should be able to test shape with failure: not object", () => {
  const testValue = 5;
  const validator = matches.shape({ a: matches.literal("b") });
  expect(validator.parse(testValue, unFold)).toEqual(
    `Shape<{a:Literal<\"b\">}>(${saferStringify(testValue)})`,
  );
});

test("should be able to test shape with failure", () => {
  const testValue = {};
  const validator = matches.shape({
    a: matches.literal("b"),
    b: matches.literal("b"),
  });
  assertSnapshot(
    '"[\\"a\\"]Shape<{a:Literal<\\"b\\">,b:Literal<\\"b\\">}>(\\"missingProperty\\")"',
    validator.parse(testValue, unFold),
  );
});
test("should be able to test shape with failure smaller", () => {
  const testValue = { a: "b" };
  const validator = matches.shape({
    a: matches.literal("b"),
    b: matches.literal("b"),
  });
  assertSnapshot(
    '"[\\"b\\"]Shape<{a:Literal<\\"b\\">,b:Literal<\\"b\\">}>(\\"missingProperty\\")"',
    validator.parse(testValue, unFold),
  );
});

test("should be able to test partial shape", () => {
  const testValue = {};
  const validator = matches.partial({ a: matches.literal("c") });
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test partial shape failure", () => {
  const testValue = { a: "a", b: "b" };
  const validator = matches.partial({
    a: matches.literal("c"),
    b: matches.literal("c"),
  });
  assertSnapshot(
    '"[\\"a\\"]Literal<\\"c\\">(\\"a\\")"',
    validator.parse(testValue, unFold),
  );
});
test("should be able to test partial shape failure smaller", () => {
  const testValue = { b: "b" };
  const validator = matches.partial({
    a: matches.literal("c"),
    b: matches.literal("c"),
  });
  assertSnapshot(
    '"[\\"b\\"]Literal<\\"c\\">(\\"b\\")"',
    validator.parse(testValue, unFold),
  );
});

test("should recover shape mismatch", () => {
  const validator = matches.shape({
    a: matches
      .shape({
        b: matches.number.onMismatch(-1),
      })
      .withMismatch(() => ({ b: -2 })),
  });

  expect(validator.parse({}, unFold)).toEqual({ a: { b: -2 } });
  expect(validator.parse({ a: {} }, unFold)).toEqual({ a: { b: -1 } });
  expect(validator.parse({ a: { b: 5 } }, unFold)).toEqual({ a: { b: 5 } });
});

test("should recover shape retry", () => {
  const validator = matches.shape({
    a: matches
      .shape({
        b: matches.number.onRetry(-1),
      })
      .withRetry(() => ({ b: -2 })),
  });

  expect(validator.parse({}, unFold)).toEqual({ a: { b: -2 } });
  expect(validator.parse({ a: {} }, unFold)).toEqual({ a: { b: -1 } });
  expect(validator.parse({ a: { b: 5 } }, unFold)).toEqual({ a: { b: 5 } });
});

test("should recover shape retry bad", () => {
  const validator = matches.shape({
    a: matches
      .shape({
        b: matches.number.onRetry("-1"),
      })
      .withRetry(() => "{ b: -2 }"),
  });

  expect(validator.parse({}, unFold)).toEqual(
    '[TypeError: Failed type: Partial<{b:WithRetry<,number>}>(undefined) given input undefined]Mapped<"",Partial<{a:WithRetry<,Mapped<"",Partial<{b:WithRetry<,number>}>>>}>>({})',
  );
  expect(validator.parse({ a: {} }, unFold)).toEqual(
    '["a"][TypeError: Failed type: number(undefined) given input undefined]Mapped<"",Partial<{b:WithRetry<,number>}>>({})',
  );
  expect(validator.parse({ a: { b: 5 } }, unFold)).toEqual({ a: { b: 5 } });
});

{
  const validator = matches.shape({
    a: matches.literal("c"),
    b: matches.literal("d").optional(),
  });
  isType<Parser<unknown, { a: "c"; b?: "d" | null | undefined }>>(validator);
  // @ts-expect-error Not type
  isType<Parser<unknown, { a: "c"; b: "d" | undefined }>>(validator);
  type Valid = { a: "c"; b?: "d" | null };
  test("should be able to test shape with partial not included", () => {
    const testValue = { a: "c" };
    const value = validator.unsafeCast(testValue);
    expect(value).toEqual(testValue);
    expect(value.b).toEqual(undefined);
    isType<Valid>(value);
    // @ts-expect-error Is not a number
    isType<number>(value);
  });
  test("should be able to test shape with partial correct", () => {
    const testValue = { a: "c", b: "d" };
    const value = validator.unsafeCast(testValue);
    expect(value).toEqual(testValue);
    isType<Valid>(value);
    // @ts-expect-error Is not a number
    isType<number>(value);
  });
  test("should be able to test shape with partial and main not included", () => {
    const testValue = { b: "d" };

    try {
      validator.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"[\\"a\\"]Shape<{a:Literal<\\"c\\">}>(\\"missingProperty\\")"',
        validator.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });
  test("should be able to test shape with value `b` as null", () => {
    const testValue = { b: null, a: "c" };

    expect(validator.parse(testValue, unFold)).toEqual(
      '["b"]Maybe<Literal<"d">>(null)',
    );
  });
  test("should be able to test shape with value `b` as undefined", () => {
    const testValue = { b: undefined, a: "c" };

    expect(validator.parse(testValue, unFold)).toEqual({
      a: "c",
      b: undefined,
    });
  });
  test("should be able to test shape with partial is wrong", () => {
    const testValue = { a: "c", b: "e" };

    try {
      validator.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"[\\"b\\"]Maybe<Literal<\\"d\\">>(\\"e\\")"',
        validator.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });
  test("should be able to shape with partials and fill in defaults", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").defaultTo("d" as const),
      f: matches.literal("f").optional(),
    });
    isType<
      Parser<
        unknown,
        {
          a: "c";
          f?: "f" | null | undefined;
          b: "d";
        }
      >
    >(validator);
    isType<
      Parser<
        unknown,
        {
          a: "c";
          f: "f" | null | undefined;
          b: "d";
        }
      > // @ts-expect-error Expecting that this is the wrong shape
    >(validator);
    type Valid = { a: "c"; b?: "d" | null };
    const testValue = { a: "c" };

    const value = validator.unsafeCast(testValue);
    expect(value).toEqual({ a: "c", b: "d" });
    expect(value.b).toEqual("d");
    isType<Valid>(value);
    // @ts-expect-error Value should not be type
    isType<number>(value);
  });

  test("should be able to shape with nullable and fill in defaults", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").defaultTo("d" as const),
      f: matches.literal("f").nullable(),
    });
    isType<
      Parser<
        unknown,
        {
          a: "c";
          f: "f" | null;
          b: "d";
        }
      >
    >(validator);
    type Valid = { a: "c"; f: "f" | null; b?: "d" | null };
    const testValue = { a: "c" };

    const value = validator.parse(testValue, unFold);
    expect(value).toEqual(
      '["f"]Shape<{a:Literal<"c">,f:Nullable<Literal<"f">>}>("missingProperty")',
    );

    const testValueCorrect = { a: "c", f: null };
    const value2 = validator.unsafeCast(testValueCorrect);
    expect(value2).toEqual({
      a: "c",
      f: null,
      b: "d",
    });
    isType<Valid>(value2);
    // @ts-expect-error Value should not be type
    isType<number>(value2);
  });
}

test("should be able to test literal", () => {
  const testValue = "a";
  const validator = matches.literal("a");
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test array literal", () => {
  const testValue = ["a", "b"];
  const validator = matches.literal(["a", "b"] as const);
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test object literal", () => {
  const testValue = { a: "a", b: ["c", "d"] };
  const validator = matches.literal({ a: "a", b: ["c", "d"] as const });
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test literal with failure", () => {
  const testValue = "a";
  const validator = matches.literal("b");
  assertSnapshot(
    '"Literal<\\"b\\">(\\"a\\")"',
    validator.parse(testValue, unFold),
  );
});
test("should be able to test unknown", () => {
  const testValue = 4;
  const validator = matches.unknown;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test nill invalid", () => {
  const testValue = 4;
  const validator = matches.nill;
  expect(validator.parse(testValue, unFold)).toEqual("null(4)");
});
test("should be able to test nill valid", () => {
  const testValue = null;
  const validator = matches.nill;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});
test("should be able to test array valid", () => {
  const testValue = ["test"];
  const validator = matches.array;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});
test("should be able to test array invalid", () => {
  const testValue = "test";
  const validator = matches.array;
  expect(validator.parse(testValue, unFold)).toEqual('Array<unknown>("test")');
});
test("should be able to test number", () => {
  const testValue = 4;
  const validator = matches.number;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test number with failure", () => {
  const testValue = "a";
  const validator = matches.number;
  assertSnapshot('"number(\\"a\\")"', validator.parse(testValue, unFold));
});

test("should be able to test string", () => {
  const testValue = "a";
  const validator = matches.string;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test string with failure", () => {
  const testValue = 5;
  const validator = matches.string;
  assertSnapshot('"string(5)"', validator.parse(testValue, unFold));
});

test("should be able to test regex", () => {
  const testValue = "test";
  const validator = matches.regex(/test/);
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test regex with failure", () => {
  const testValue = "Invalid";
  const validator = matches.regex(/test/);
  assertSnapshot('"/test/(\\"Invalid\\")"', validator.parse(testValue, unFold));
});

test("should be able to test isFunction", () => {
  const testValue = () => ({});
  const validator = matches.isFunction;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test isFunction with failure", () => {
  const testValue = "test";
  const validator = matches.isFunction;
  assertSnapshot('"Function(\\"test\\")"', validator.parse(testValue, unFold));
});

test("should be able to test boolean", () => {
  const testValue = true;
  const validator = matches.boolean;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test boolean false", () => {
  const testValue = false;
  const validator = matches.boolean;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test boolean with failure", () => {
  const testValue = 0;
  const validator = matches.boolean;
  assertSnapshot('"boolean(0)"', validator.parse(testValue, unFold));
});

test("should be able to test boolean falsy with failure", () => {
  const testValue = "test";
  const validator = matches.boolean;
  assertSnapshot('"boolean(\\"test\\")"', validator.parse(testValue, unFold));
});

test("should be able to test any", () => {
  const testValue = 0;
  const validator = matches.any;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test object", () => {
  const testValue = {};
  const validator = matches.object;
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be able to test object with failure", () => {
  const testValue = 5;
  const validator = matches.object;
  expect(validator.parse(testValue, unFold)).toEqual("object(5)");
});

test("should be able to test tuple(number, string)", () => {
  const testValue = [4, "test"];
  const validator = matches.tuple(matches.number, matches.string);
  // @ts-expect-error Invalid tuple, inverted
  const _badOutput: [string, number] = validator.unsafeCast(testValue);
  // @ts-expect-error Type '[number, string]' is not assignable to type '[]'.\n  Source has 2 element(s) but target allows only 0.
  const _badOutput2: [] = validator.unsafeCast(testValue);
  const _goodOutput: [number, string] = validator.unsafeCast(testValue);
  const output: [number, string] = validator.parse(testValue, unFold);
  expect(output).toEqual(testValue);
});

test("should be able to test tuple(number, string) with failure", () => {
  const testValue = ["bad", 5];
  const validator = matches.tuple(matches.number, matches.string);
  assertSnapshot(
    '"[\\"0\\"]number(\\"bad\\")"',
    validator.parse(testValue, unFold),
  );
});

test("should be able to use matches.when", () => {
  const testValue = 4;
  const validator = matches.number;
  expect(
    matches(testValue)
      .when(validator, () => true)
      .defaultTo(false),
  ).toEqual(true);
});

test("should be able to use matches.when fallback for the default to", () => {
  const testValue = "5";
  const validator = matches.number;
  expect(
    matches(testValue)
      .when(validator, () => true)
      .defaultTo(false),
  ).toEqual(false);
});

test("should union several matchers", () => {
  const testValue = 4;
  const validator = matches.some(matches.number, matches.string);
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("should be fallible union several matchers", () => {
  const testValue = false;
  const validator = matches.some(matches.number, matches.string);
  assertSnapshot(
    '"Or<string,number>(false)"',
    validator.parse(testValue, unFold),
  );
});

test("should intersection several matchers", () => {
  const testValue = 4;
  const isEven = matches.guard(
    (x: unknown): x is number => isNumber(x) && x % 2 === 0,
    "isEven",
  );
  const validator = matches.every(matches.number, isEven);
  expect(validator.parse(testValue, unFold)).toEqual(testValue);
});

test("every should clean up anys", () => {
  const every = matches.every(matches.any, matches.any);
  expect(every).toEqual(matches.any);
});

test("should be remove any in chains", () => {
  const testValue = 5;
  const validator = matches.any.concat(matches.string).concat(matches.any);
  assertSnapshot('"string(5)"', validator.parse(testValue, unFold));
});

test("should be remove any in chains", () => {
  const testValue = 5;
  const validator = matches.any.concat(matches.string).concat(matches.any);
  assertSnapshot('"string(5)"', validator.parse(testValue, unFold));
});
test("should be fallible union several matchers", () => {
  const testValue = 5;
  const isEven = matches.guard(
    (x: unknown): x is number => isNumber(x) && x % 2 === 0,
    "isEven",
  );
  const isGt6 = matches.guard(
    (x: unknown): x is number => isNumber(x) && x > 6,
    "isGt6",
  );
  const validator = matches.every(matches.number, isEven, isGt6);
  assertSnapshot('"isEven(5)"', validator.parse(testValue, unFold));
});

test("should have array of test", () => {
  const testValue = [5, 5, 5];
  const arrayOf = matches.arrayOf(matches.literal(5));
  expect(arrayOf.parse(testValue, unFold)).toEqual(testValue);
});
test("should have array of test negative", () => {
  const testValue = "bad";
  const arrayOf = matches.arrayOf(matches.literal(5));
  assertSnapshot(
    '"ArrayOf<Literal<5>>(\\"bad\\")"',
    arrayOf.parse(testValue, unFold),
  );
});
test("should be able to get the value of an array of", () => {
  const testValue = [{ test: 5 }];
  const matchTest = matches.shape({ test: matches.number });
  type Test = typeof matchTest._TYPE;
  const arrayOf = matches.arrayOf(matchTest);
  const _testValue = assertNeverUnknown(arrayOf.unsafeCast(testValue)[0]);
  const testValuesGood: Test = arrayOf.unsafeCast(testValue)[0];
  expect(testValuesGood).toEqual(testValue[0]);
});
test("should be able to get the value of an array of using (object, array) instead of (shape, arrayOf)", () => {
  const testValue = [{ test: 5 }];
  const matchTest = matches.object({ test: matches.number });
  type Test = typeof matchTest._TYPE;
  const arrayOf = matches.array(matchTest);
  const _testValue = assertNeverUnknown(arrayOf.unsafeCast(testValue)[0]);
  const testValuesGood: Test = arrayOf.unsafeCast(testValue)[0];
  expect(testValuesGood).toEqual(testValue[0]);
});
test("should be able to match literals", () => {
  const matcher = matches.literals(4, "3");
  const firstExpectedOutcome: 4 | "3" = matcher.parse(4, unFold);
  expect(firstExpectedOutcome).toEqual(4);
  expect(matcher.parse("3", unFold)).toEqual("3");
  assertSnapshot('"Literal<4,\\"3\\">(3)"', matcher.parse(3, unFold));
  assertSnapshot('"Literal<4,\\"3\\">(\\"4\\")"', matcher.parse("4", unFold));
});
test("should have array of test fail", () => {
  const testValue = [5, 3, 2, 5, 5];
  const arrayOf = matches.arrayOf(matches.literal(5));
  assertSnapshot('"[1]Literal<5>(3)"', arrayOf.parse(testValue, unFold));
});

test("should refinement matchers", () => {
  const testValue = 4;
  const isEven = matches.number.refine((num): num is number => {
    // Make sure that the refine types pass down the number
    const _test: number = num;
    // Asserting to typescript that the infered type not something else
    // @ts-expect-error Type mismatch
    const _test2: string = num;
    return num % 2 === 0;
  }, "isEven");
  expect(isEven.parse(testValue, unFold)).toEqual(testValue);
});
test("should valid matchers", () => {
  const testValue = 4;
  const isEven = matches.number.validate((num) => {
    // Make sure that the refine types pass down the number
    const _test: number = num;
    // Asserting to typescript that the infered type not something else
    // @ts-expect-error Type mismatch
    const _test2: string = num;
    return num % 2 === 0;
  }, "isEven");
  expect(isEven.parse(testValue, unFold)).toEqual(testValue);
});

test("should refinement matchers fail", () => {
  const testValue = 4;
  const isEven = matches.number.refine(
    (num: number): num is number => num % 2 === 0,
    "isEven",
  );
  assertSnapshot('"parsed(4)"', isEven.parse(testValue, stringFold));
});
test("should refinement matchers fail", () => {
  const testValue = 5;
  const isEven = matches.number.refine(
    (num: number): num is number => num % 2 === 0,
    "isEven",
  );
  assertSnapshot('"isEven(5)"', isEven.parse(testValue, unFold));
});

test("should refinement matchers fail cleanup any", () => {
  const testValue = 5;
  const isEven = matches.any.refine(
    (num: any): num is number => num % 2 === 0,
    "isEven",
  );
  try {
    isEven.unsafeCast(testValue);
  } catch (e: any) {
    assertSnapshot('"Failed type: isEven(5) given input 5"', e.message);
  }
});

test("should throw on invalid unsafe match throw", () => {
  try {
    matches.partial({}).unsafeCast(5);
  } catch (e: any) {
    assertSnapshot('"Failed type: Partial<{}>(5) given input 5"', e.message);
  }
});
test("should throw on invalid unsafe match throw", async () => {
  try {
    await matches.partial({}).castPromise(5);
    expect("never").toBe("called");
  } catch (e: any) {
    assertSnapshot(`{}`, e);
  }
});
test("should throw on invalid unsafe match throw", async () => {
  expect(await matches.literal(5).castPromise(5)).toBe(5);
});
test("some should be any if empty", () => {
  expect(matches.some()).toEqual(matches.any);
});
test("some should only return the unique", () => {
  assertSnapshot(
    '"Or<number,Literal<\\"test\\">,number>(\\"hello\\")"',
    matches
      .some(matches.number, matches.literal("test"), matches.number)
      .parse("hello", unFold),
  );
});
test("some should only return the unique", () => {
  assertSnapshot(
    '"Or<number,number>(\\"hello\\")"',
    matches.some(matches.number, matches.number).parse("hello", unFold),
  );
});

test("should guard without a name", () => {
  expect(matches.guard((x): x is number => Number(x) > 3).unsafeCast(6)).toBe(
    6,
  );
});
test("should guard without a name failure", () => {
  assertSnapshot(
    '"invalid({\\"value\\":2,\\"keys\\":[],\\"parser\\":{\\"typeName\\":\\"\\",\\"description\\":{\\"name\\":\\"Guard\\",\\"children\\":[],\\"extras\\":[\\"\\"]}}})"',
    matches.guard((x): x is number => Number(x) > 3).parse(2, stringFold),
  );
});

test("should be able to test is object for event", () => {
  const event = new Event("test");
  expect(matches.object.parse(event, unFold)).toBe(event);
});

{
  class Fake {
    constructor(readonly value: number) {}
  }
  test("testing is instance: should be able to validate it is a instance", () => {
    const value = new Fake(3);
    expect(matches.instanceOf(Fake).test(value)).toEqual(true);
    expect(matches.instanceOf(Fake).parse(value, unFold)).toEqual(value);
  });
  test("testing is instance: should be able to validate it is not a instance", () => {
    const value = {
      value: 4,
    };
    expect(matches.instanceOf(Fake).test(value)).toEqual(false);
    assertSnapshot(
      '"isFake({\\"value\\":4})"',
      matches.instanceOf(Fake).parse(value, unFold),
    );
  });
}

test("should fail on a circular object", () => {
  const o: any = {};
  o.o = o;
  assertSnapshot(
    '"Function([object Object])"',
    matches.isFunction.parse(o, unFold),
  );
});

test("should be able to map validation", () => {
  const testString = "test";
  const event = new Event(testString);
  const isEvent = matches.guard(
    (x: unknown): x is Event => x instanceof Event,
    "isEvent",
  );
  expect(
    isEvent
      .map((x) => {
        // Asserting to typescript that the infered type is event
        const _test: Event = x;
        // @ts-expect-error Asserting to typescript that the infered type not something else
        const _test2: number = x;
        return x.type;
      })
      .parse(event, unFold),
  ).toBe(testString);
});
test("should be able to map validation with name", () => {
  const testString = "test";
  const event = new Event(testString);
  const isEvent = matches.guard(
    (x: unknown): x is Event => x instanceof Event,
    "isEvent",
  );
  expect(
    isEvent
      .map(function asType(x) {
        return x.type;
      })
      .parse(event, unFold),
  ).toBe(testString);
});

{
  const maybeNumber = matches.number.optional();

  test("with a number.maybe matcher: a number in", () => {
    const input = 4;
    const expectedAnswer = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expectedAnswer);
  });
  test("with a number.maybe matcher: a null in", () => {
    const input = null;
    expect(maybeNumber.parse(input, unFold)).toBe("Maybe<number>(null)");
  });
  test("with a number.maybe matcher: a undefined in", () => {
    const input = undefined;
    expect(maybeNumber.parse(input, unFold)).toBe(undefined);
  });
  test("with a number.maybe matcher: a object in", () => {
    const input = {};
    assertSnapshot(
      '"\\"Maybe<number>({})\\""',
      saferStringify(maybeNumber.parse(input, unFold)),
    );
  });
}
{
  const nullableNumber = matches.number.nullable();

  test("with a number.nullable matcher: a number in", () => {
    const input = 4;
    const expectedAnswer = 4;
    expect(nullableNumber.parse(input, unFold)).toBe(expectedAnswer);
  });
  test("with a number.nullable matcher: a null in", () => {
    const input = null;
    expect(nullableNumber.parse(input, unFold)).toBe(null);
  });
  test("with a number.nullable matcher: a undefined in", () => {
    const input = undefined;
    assertSnapshot(
      '"Nullable<number>(undefined)"',
      nullableNumber.parse(input, unFold),
    );
  });
  test("with a number.nullable matcher: a object in", () => {
    const input = {};
    assertSnapshot(
      '"\\"Nullable<number>({})\\""',
      saferStringify(nullableNumber.parse(input, unFold)),
    );
  });
}

{
  const maybeNumber = matches.number.defaultTo(0);

  test("with a number.defaultTo matcher: a number in", () => {
    const input = 4;
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.defaultTo matcher: a null in", () => {
    const input = null;
    const expected = "Default<0,Maybe<number>>(null)";
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.defaultTo matcher: a undefined in", () => {
    const input = undefined;
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.defaultTo matcher: a object in", () => {
    const input = {};
    assertSnapshot(
      '"Default<0,Maybe<number>>({})"',
      maybeNumber.parse(input, unFold),
    );
  });
}
{
  const retryNumber = matches.number.withRetry((a) =>
    string.test(a) ? Number.parseFloat(a) : a,
  );

  test("with a number.withRetry matcher: a number in", () => {
    const input = 4;
    const expected = 4;
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withRetry matcher: a string number in", () => {
    const input = "7";
    const expected = 7;
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.withRetry matcher: a null in", () => {
    const input = null;
    const expected = "number(null)";
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.withRetry matcher: a undefined in", () => {
    const input = undefined;
    const expected = "number(undefined)";
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.withRetry matcher: a object in", () => {
    const input = {};
    assertSnapshot('"number({})"', retryNumber.parse(input, unFold));
  });
}
{
  const maybeNumber = matches.number.mapNullish(0);

  test("with a number.mapNullish matcher: a number in", () => {
    const input = 4;
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.mapNullish matcher: a null in", () => {
    const input = null;
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.mapNullish matcher: a undefined in", () => {
    const input = undefined;
    const expected = "Nullable<0,Nullable<number>>(undefined)";
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.mapNullish matcher: a object in", () => {
    const input = {};
    assertSnapshot(
      '"Nullable<0,Nullable<number>>({})"',
      maybeNumber.parse(input, unFold),
    );
  });
}

{
  const maybeNumber = matches.number.voidable();

  test("with a number.voidable matcher: a number in", () => {
    const input = 4;
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.voidable matcher: a null in", () => {
    const input = null;
    const expected = null;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.voidable matcher: a undefined in", () => {
    const input = undefined;
    const expected = undefined;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.voidable matcher: a object in", () => {
    const input = {};
    assertSnapshot(
      '"Maybe<Nullable<number>>({})"',
      maybeNumber.parse(input, unFold),
    );
  });
}

{
  const maybeNumber = matches.number.onMismatch(0);

  test("with a number.onMismatch matcher a number in", () => {
    const input = 4;
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.onMismatch matcher a null in", () => {
    const input = null;
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.onMismatch matcher a undefined in", () => {
    const input = undefined;
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.onMismatch matcher a object in", () => {
    const input = {};
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`0`);
  });
  test("with a number.onMismatch matcher a string in", () => {
    const input = "4";
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`0`);
  });
}
{
  const maybeNumber = matches.number.withMismatch(() => 5);

  test("with a number.withMismatch matcher a number in", () => {
    const input = 4;
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.withMismatch matcher a null in", () => {
    const input = null;
    const expected = 5;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.withMismatch matcher a undefined in", () => {
    const input = undefined;
    const expected = 5;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });
  test("with a number.withMismatch matcher a object in", () => {
    const input = {};
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`5`);
  });
  test("with a number.withMismatch matcher a string in", () => {
    const input = "4";
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`5`);
  });
}

{
  test("Testing as a filter: should be able to utilize the test in a filter for typing", () => {
    expect([0, "hi", 5, {}].filter(matches.number.test)).toEqual([0, 5]);
  });
}
{
  const enumTest = matches.literals("A", "B").rename("enumTest");
  type EnumTest = typeof enumTest._TYPE;
  test("Testing named: should be able to test valid should be the same", () => {
    const input = "A";
    // @ts-expect-error A is not b
    const _output: "B" = enumTest.unsafeCast(input);
    const _correctType: EnumTest = enumTest.unsafeCast(input);
  });
  test("Testing named: should be able to test invalid with wrapped name", () => {
    const input = "bad";
    const output = enumTest.parse(input, unFold);
    assertSnapshot(
      `"Named<\\"enumTest\\",Literal<\\"A\\",\\"B\\">>(\\"bad\\")"`,
      output,
    );
  });
}

{
  const testMatcher = matches.dictionary(
    [matches.literal("test"), matches.literal("value")],
    [matches.literal("test2"), matches.literal("value2")],
  );
  test("Testing dictionaries: should be able to check correct shape", () => {
    const input = { test: "value", test2: "value2" };
    const output: {
      test: "value";
      test2: "value2";
    } = testMatcher.unsafeCast(input);
    expect(output).toEqual(input);
    //@ts-expect-error Wrong shape in test
    const _incorrectCast: {
      test: "valueWrong";
      test2: "value2";
    } = testMatcher.unsafeCast(input);
    const _correctCast: {
      test: "value";
      test2: "value2";
    } = testMatcher.unsafeCast(input);
  });
  test("Testing dictionaries: should be able to check incorrect shape", () => {
    const input = { test: "invalid", test2: "value2" };
    const output = testMatcher.parse(input, unFold);
    assertSnapshot(`"[test]Literal<\\"value\\">(\\"invalid\\")"`, output);
  });
  test("Testing dictionaries: should be able to check empty", () => {
    const testMatcher = matches.dictionary();
    const input = { test: "invalid", test2: "value2" };
    const output = testMatcher.parse(input, unFold);
    assertSnapshot(`{"test":"invalid","test2":"value2"}`, output);
  });
  test("Testing dictionaries: should be able to check incorrect shape deep", () => {
    const input = [
      {
        second: "invalid",
      },
    ];
    const output = matches
      .tuple(
        matches.shape({
          second: matches.literal("valid"),
        }),
      )
      .parse(input, unFold);
    assertSnapshot(
      `"[\\"0\\"][\\"second\\"]Literal<\\"valid\\">(\\"invalid\\")"`,
      output,
    );
  });

  test("Testing dictionaries: should be able to check tuple exact shape", () => {
    const input = [1, 2, 3];
    const matcher = matches.tuple(
      matches.number,
      matches.literal(2),
      matches.number,
    );
    // @ts-expect-error Wrong shape
    const outputWrong: [number, number] = matcher.unsafeCast(input);
    // @ts-expect-error Wrong shape
    const _outputWrong2: [number, 3, number] = matcher.unsafeCast(input);
    // @ts-expect-error Wrong shape
    const _outputWrong3: [number, number, number, number] =
      matcher.unsafeCast(input);
    const outputRight1: [number, number, number] = matcher.unsafeCast(input);
    const _outputRight2: [number, 2, number] = matcher.unsafeCast(input);
    // expected type: Validator<unknown, [number,number,number]>
    // actual type: Validator<unknown, never>;
    expect(outputRight1).toEqual(input);
    expect(outputWrong).toEqual(input);
  });
  test("Testing dictionaries: should be able to project values", () => {
    const input = { test: "value" };
    const matcher = matches.dictionary([
      matches.literal("test"),
      matches.literal("value").map((_x) => `value2` as const),
    ]);
    // @ts-expect-error Test missing
    const _outputWrong: { test: "value" } = matcher.unsafeCast(input);
    const _outputOk: { test: string } = matcher.unsafeCast(input);
    const outputMostCorrect: { test: "value2" } = matcher.unsafeCast(input);
    expect(outputMostCorrect.test).toEqual("value2");
  });
  test("Testing dictionaries: should be able to still reject values", () => {
    const input = { test: "value2" };
    const matcher = matches.dictionary([
      matches.literal("test"),
      matches.literal("value").map((_x) => `value2` as const),
    ]);
    const output = matcher.parse(input, unFold);
    assertSnapshot(`"[test]Literal<\\"value\\">(\\"value2\\")"`, output);
  });
  test("Testing dictionaries: should be able to project keys", () => {
    const input = { test: "value" };
    const matcher = matches.dictionary([
      matches.literal("test").map((_x) => "projected" as const),
      matches.literal("value"),
    ]);
    // @ts-expect-error Property 'test' is missing in type
    const _incorrectOutput: { test: "value" } = matcher.unsafeCast(input);
    const output: { projected: "value" } = matcher.unsafeCast(input);
    expect(output.projected).toEqual("value");
  });
}

{
  test("Issue where dictionary reordered", () => {
    const dataIn = {
      A: 1,
      B: 1,
      C: 1,
    };
    const expectedKeys = JSON.stringify(Object.keys(dataIn));
    const newShape = matches(dataIn)
      .when(matches.dictionary([matches.string, matches.unknown]), (x) => x)
      .defaultToLazy(() => {
        throw new Error("Should match");
      });
    const actualKeys = JSON.stringify(Object.keys(newShape));

    expect(actualKeys).toEqual(expectedKeys);
  });
}

export {};
