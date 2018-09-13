import matches from "./matches";
import fc from "fast-check";
import * as gens from "./matches.gen";

const isNumber = (x: unknown): x is number => typeof x === "number";

describe("matches", () => {
  describe("base", () => {
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
    test("testing falls through", () => {
      const testValue = { a: "c" };
      const left = { left: true };
      const right = { right: true };
      const testMatch = matches.shape({ a: matches.literal("d") });
      const validator = matches(testValue)
        .when(testMatch, () => left)
        .defaultToLazy(() => right);
      expect(validator).toEqual(right);
    });
  });
  describe("properties", () => {
    test("a matched case will always be the equal to matcher or less than", () => {
      fc.assert(
        fc.property(gens.testSetup, testSetup => {
          const indexOfMatchedValue = (value: unknown) =>
            testSetup.setupInformation
              .map(x => x.matchValue)
              .indexOf(value as any);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatch(testSetup.randomExample.value)
          );
          expect(foundIndex).toBeLessThanOrEqual(testSetup.randomExample.index);
        })
      );
    });
    test("a matcher pair will always match it's example", () => {
      fc.assert(
        fc.property(gens.matcherPairs, ({ example, matcher }) => {
          matcher.unsafeCast(example);
        })
      );
    });
    test("a matcher will always be a function to Either of the same type or string on error", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs,
          fc.anything(),
          ({ matcher }, example) => {
            const matchedValue = matcher(example);
            if (matchedValue.isLeft()) {
              expect(typeof matchedValue.value).toBe("string");
            } else {
              expect(matchedValue.value).toBe(example);
            }
          }
        )
      );
    });
    test("a matched value will not go to default", () => {
      fc.assert(
        fc.property(gens.testSetup, testSetup => {
          const indexOfMatchedValue = (value: unknown) =>
            testSetup.setupInformation
              .map(x => x.matchValue)
              .indexOf(value as any);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatch(testSetup.randomExample.value)
          );
          if (testSetup.randomExample.index > -1) {
            expect(foundIndex).toBeGreaterThanOrEqual(0);
          }
        })
      );
    });
  });

  test("should be able to test shape", () => {
    const testValue = { a: "c" };
    const validator = matches.shape({ a: matches.literal("c") });
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test shape with failure", () => {
    const testValue = { a: "c" };
    const validator = matches.shape({ a: matches.literal("b") });
    expect(validator(testValue).value).toEqual(
      'fail every(validationErrors(@a -> failed literal["b"]("c")))'
    );
  });

  test("should be able to test shape with failure", () => {
    const testValue = {};
    const validator = matches.shape({ a: matches.literal("b") });
    expect(validator(testValue).value).toEqual("fail every(missing(a))");
  });

  test("should be able to test partial shape", () => {
    const testValue = {};
    const validator = matches.partial({ a: matches.literal("c") });
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test literal", () => {
    const testValue = "a";
    const validator = matches.literal("a");
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test literal with failure", () => {
    const testValue = "a";
    const validator = matches.literal("b");
    expect(validator(testValue).value).toEqual('failed literal["b"]("a")');
  });

  test("should be able to test number", () => {
    const testValue = 4;
    const validator = matches.number;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test number with failure", () => {
    const testValue = "a";
    const validator = matches.number;
    expect(validator(testValue).value).toEqual('failed isNumber("a")');
  });

  test("should be able to test string", () => {
    const testValue = "a";
    const validator = matches.string;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test string with failure", () => {
    const testValue = 5;
    const validator = matches.string;
    expect(validator(testValue).value).toEqual("failed string(5)");
  });

  test("should be able to test regex", () => {
    const testValue = /test/;
    const validator = matches.regex;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test regex with failure", () => {
    const testValue = "test";
    const validator = matches.regex;
    expect(validator(testValue).value).toEqual('failed regex("test")');
  });

  test("should be able to test isFunction", () => {
    const testValue = () => ({});
    const validator = matches.isFunction;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test isFunction with failure", () => {
    const testValue = "test";
    const validator = matches.isFunction;
    expect(validator(testValue).value).toEqual('failed isFunction("test")');
  });

  test("should be able to test boolean", () => {
    const testValue = true;
    const validator = matches.boolean;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test boolean false", () => {
    const testValue = false;
    const validator = matches.boolean;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test boolean with failure", () => {
    const testValue = 0;
    const validator = matches.boolean;
    expect(validator(testValue).value).toEqual("failed boolean(0)");
  });

  test("should be able to test boolean falsy with failure", () => {
    const testValue = "test";
    const validator = matches.boolean;
    expect(validator(testValue).value).toEqual('failed boolean("test")');
  });

  test("should be able to test any", () => {
    const testValue = 0;
    const validator = matches.any;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test object", () => {
    const testValue = {};
    const validator = matches.object;
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test object with failure", () => {
    const testValue = 5;
    const validator = matches.object;
    expect(validator(testValue).value).toEqual("failed isObject(5)");
  });

  test("should be able to test tuple(number, string)", () => {
    const testValue = [4, "test"];
    const validator = matches.tuple([matches.number, matches.string]);
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be able to test tuple(number, string) with failure", () => {
    const testValue = ["bad", 5];
    const validator = matches.tuple([matches.number, matches.string]);
    expect(validator(testValue).value).toEqual(
      'fail every(validationErrors(@0 -> failed isNumber("bad"), @1 -> failed string(5)))'
    );
  });

  test("should be able to use matches.when", () => {
    const testValue = 4;
    const validator = matches.number;
    expect(
      matches(testValue)
        .when(validator, () => true)
        .defaultTo(false)
    ).toEqual(true);
  });

  test("should be able to use matches.when fallback for the default to", () => {
    const testValue = "5";
    const validator = matches.number;
    expect(
      matches(testValue)
        .when(validator, () => true)
        .defaultTo(false)
    ).toEqual(false);
  });

  test("should union several matchers", () => {
    const testValue = 4;
    const validator = matches.some(matches.number, matches.string);
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be fallible union several matchers", () => {
    const testValue = false;
    const validator = matches.some(matches.number, matches.string);
    expect(validator(testValue).value).toEqual(
      "fail some(failed isNumber(false), failed string(false))"
    );
  });

  test("should intersection several matchers", () => {
    const testValue = 4;
    const isEven = matches.guard(x => isNumber(x) && x % 2 === 0, "isEven");
    const validator = matches.every(matches.number, isEven);
    expect(validator(testValue).value).toEqual(testValue);
  });

  test("should be fallible union several matchers", () => {
    const testValue = 5;
    const isEven = matches.guard(x => isNumber(x) && x % 2 === 0, "isEven");
    const validator = matches.every(matches.number, isEven);
    expect(validator(testValue).value).toEqual("fail every(failed isEven(5))");
  });

  test("should refinement matchers", () => {
    const testValue = 4;
    const isEven = matches.number.refine(
      (num: number) => num % 2 === 0,
      "isEven"
    );
    expect(isEven(testValue).value).toEqual(testValue);
  });
});
