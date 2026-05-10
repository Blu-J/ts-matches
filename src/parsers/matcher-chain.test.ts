import { test, expect } from "@jest/globals";
import matches from "../matches";
import { any, every, Parser, shape, string } from "../parsers/index";
import { isType } from "../tests/helpers";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("MatcherChain", () => {
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
        // @ts-expect-error I'm expecting that unwrap is not guaranteed
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

  test("should be remove any in chains", () => {
    const testValue = 5;
    const validator = matches.any.concat(matches.string).concat(matches.any);
    assertSnapshot('"string(5)"', validator.parse(testValue, unFold));
  });

  test("with a number.maybe matcher: should filter", () => {
    expect([0, "hi", 5, {}].filter(matches.number.test)).toEqual([0, 5]);
  });
});

describe("InstanceOfParser", () => {
  test("testing is instance: should be able to validate it is a instance", () => {
    class Fake {
      constructor(readonly value: number) {}
    }
    const value = new Fake(3);
    expect(matches.instanceOf(Fake).test(value)).toEqual(true);
    expect(matches.instanceOf(Fake).parse(value, unFold)).toEqual(value);
  });

  test("testing is instance: should be able to validate it is not a instance", () => {
    class Fake {
      constructor(readonly value: number) {}
    }
    const value = {
      value: 4,
    };
    expect(matches.instanceOf(Fake).test(value)).toEqual(false);
    assertSnapshot(
      '"isFake({\\"value\\":4})"',
      matches.instanceOf(Fake).parse(value, unFold),
    );
  });
});

describe("RegexParser", () => {
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
});

describe("VoidableParser", () => {
  test("with a number.voidable matcher: a number in", () => {
    const input = 4;
    const maybeNumber = matches.number.voidable();
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.voidable matcher: a null in", () => {
    const input = null;
    const maybeNumber = matches.number.voidable();
    const expected = null;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.voidable matcher: a undefined in", () => {
    const input = undefined;
    const maybeNumber = matches.number.voidable();
    const expected = undefined;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.voidable matcher: a object in", () => {
    const input = {};
    const maybeNumber = matches.number.voidable();
    assertSnapshot(
      '"Maybe<Nullable<number>>({})"',
      maybeNumber.parse(input, unFold),
    );
  });
});

describe("WithMismatch", () => {
  test("with a number.withMismatch matcher a number in", () => {
    const input = 4;
    const maybeNumber = matches.number.withMismatch(() => 5);
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withMismatch matcher a null in", () => {
    const input = null;
    const maybeNumber = matches.number.withMismatch(() => 5);
    const expected = 5;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withMismatch matcher a undefined in", () => {
    const input = undefined;
    const maybeNumber = matches.number.withMismatch(() => 5);
    const expected = 5;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withMismatch matcher a object in", () => {
    const input = {};
    const maybeNumber = matches.number.withMismatch(() => 5);
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`5`);
  });

  test("with a number.withMismatch matcher a string in", () => {
    const input = "4";
    const maybeNumber = matches.number.withMismatch(() => 5);
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`5`);
  });
});
