import matches, { Some, Right, None, Left } from "./matches";
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
          const indexOfMatchedValue = (value: any) =>
            testSetup.setupInformation.map(x => x.matchValue).indexOf(value);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatch(testSetup.randomExample.value)
          );
          expect(foundIndex).toBeLessThanOrEqual(testSetup.randomExample.index);
        })
      );
    });
    test("a counter matched case will never be the equal to matcher", () => {
      fc.assert(
        fc.property(gens.testSetup, testSetup => {
          const indexOfMatchedValue = (value: any) =>
            testSetup.setupInformation.map(x => x.matchValue).indexOf(value);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatch(testSetup.randomExample.counter)
          );
          if (testSetup.randomExample.counter !== gens.noPossibleCounter) {
            expect(foundIndex).not.toEqual(testSetup.randomExample.index);
          }
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
    test("a matcher pair will never match it's counter example and throws", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs.filter(
            x => x.counterExample !== gens.noPossibleCounter
          ),
          ({ counterExample, matcher }) => {
            expect(() => matcher.unsafeCast(counterExample)).toThrow();
          }
        )
      );
    });
    test("a matcher will always be a function to Either of the same type or string on error", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs,
          fc.anything(),
          ({ matcher }, example) => {
            const matchedValue = matcher.apply(example);
            matchedValue.fold({
              left: (value: any) => {
                expect(typeof value).toBe("string");
              },
              right: (value: any) => {
                expect(value).toEqual(example);
              }
            });
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
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test shape with failure", () => {
    const testValue = { a: "c" };
    const validator = matches.shape({ a: matches.literal("b") });
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"@a literal[b](c)"`
    );
  });

  test("should be able to test shape with failure: not object", () => {
    const testValue = 5;
    const validator = matches.shape({ a: matches.literal("b") });
    expect(validator.apply(testValue).value).toEqual(
      `isObject(${JSON.stringify(testValue)})`
    );
  });

  test("should be able to test shape with failure", () => {
    const testValue = {};
    const validator = matches.shape({
      a: matches.literal("b"),
      b: matches.literal("b")
    });
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"@a literal[b](undefined)"`
    );
  });

  test("should be able to test partial shape", () => {
    const testValue = {};
    const validator = matches.partial({ a: matches.literal("c") });
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test partial shape failure", () => {
    const testValue = { a: "a", b: "b" };
    const validator = matches.partial({
      a: matches.literal("c"),
      b: matches.literal("c")
    });
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"(@a literal[c](a), @b literal[c](b))"`
    );
  });

  test("should be able to test literal", () => {
    const testValue = "a";
    const validator = matches.literal("a");
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test literal with failure", () => {
    const testValue = "a";
    const validator = matches.literal("b");
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"literal[b](a)"`
    );
  });

  test("should be able to test number", () => {
    const testValue = 4;
    const validator = matches.number;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test number with failure", () => {
    const testValue = "a";
    const validator = matches.number;
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"isNumber(a)"`
    );
  });

  test("should be able to test string", () => {
    const testValue = "a";
    const validator = matches.string;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test string with failure", () => {
    const testValue = 5;
    const validator = matches.string;
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"string(5)"`
    );
  });

  test("should be able to test regex", () => {
    const testValue = /test/;
    const validator = matches.regex;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test regex with failure", () => {
    const testValue = "test";
    const validator = matches.regex;
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"regex(test)"`
    );
  });

  test("should be able to test isFunction", () => {
    const testValue = () => ({});
    const validator = matches.isFunction;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test isFunction with failure", () => {
    const testValue = "test";
    const validator = matches.isFunction;
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"isFunction(test)"`
    );
  });

  test("should be able to test boolean", () => {
    const testValue = true;
    const validator = matches.boolean;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test boolean false", () => {
    const testValue = false;
    const validator = matches.boolean;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test boolean with failure", () => {
    const testValue = 0;
    const validator = matches.boolean;
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"boolean(0)"`
    );
  });

  test("should be able to test boolean falsy with failure", () => {
    const testValue = "test";
    const validator = matches.boolean;
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"boolean(test)"`
    );
  });

  test("should be able to test any", () => {
    const testValue = 0;
    const validator = matches.any;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test object", () => {
    const testValue = {};
    const validator = matches.object;
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test object with failure", () => {
    const testValue = 5;
    const validator = matches.object;
    expect(validator.apply(testValue).value).toEqual("isObject(5)");
  });

  test("should be able to test tuple(number, string)", () => {
    const testValue = [4, "test"];
    const validator = matches.tuple([matches.number, matches.string]);
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be able to test tuple(number, string) with failure", () => {
    const testValue = ["bad", 5];
    const validator = matches.tuple([matches.number, matches.string]);
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"@0 isNumber(bad)"`
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
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be fallible union several matchers", () => {
    const testValue = false;
    const validator = matches.some(matches.number, matches.string);
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"some(isNumber(false), string(false))"`
    );
  });

  test("should intersection several matchers", () => {
    const testValue = 4;
    const isEven = matches.guard(
      (x: unknown) => isNumber(x) && x % 2 === 0,
      "isEven"
    );
    const validator = matches.every(matches.number, isEven);
    expect(validator.apply(testValue).value).toEqual(testValue);
  });

  test("should be fallible union several matchers", () => {
    const testValue = 5;
    const isEven = matches.guard(
      (x: unknown) => isNumber(x) && x % 2 === 0,
      "isEven"
    );
    const isGt6 = matches.guard((x: unknown) => isNumber(x) && x > 6, "isGt6");
    const validator = matches.every(matches.number, isEven, isGt6);
    expect(validator.apply(testValue).value).toMatchInlineSnapshot(
      `"isEven(5)"`
    );
  });

  test("should have array of test", () => {
    const testValue = [5, 5, 5];
    const arrayOf = matches.arrayOf(matches.literal(5));
    expect(arrayOf.apply(testValue).value).toEqual(testValue);
  });
  test("should have array of test fail", () => {
    const testValue = [5, 3, 2, 5, 5];
    const arrayOf = matches.arrayOf(matches.literal(5));
    expect(arrayOf.apply(testValue).value).toMatchInlineSnapshot(
      `"@1 literal[5](3)"`
    );
  });

  test("should refinement matchers", () => {
    const testValue = 4;
    const isEven = matches.number.refine(
      (num: number) => num % 2 === 0,
      "isEven"
    );
    expect(isEven.apply(testValue).value).toEqual(testValue);
  });

  test("should refinement matchers fail", () => {
    const testValue = 4;
    const isEven = matches.number.refine(
      (num: number) => num % 2 === 0,
      "isEven"
    );
    expect(isEven.apply(testValue).toString()).toMatchInlineSnapshot(
      `"right(4)"`
    );
  });

  test("should throw on invalid unsafe match throw", () => {
    expect(() =>
      matches.partial({}).unsafeCast(5)
    ).toThrowErrorMatchingInlineSnapshot(`"Failed type: isObject(5)"`);
  });
  test("should throw on invalid unsafe match throw", async () => {
    try {
      await matches.partial({}).castPromise(5);
      expect("never").toBe("called");
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`"isObject(5)"`);
    }
  });
  test("should throw on invalid unsafe match throw", async () => {
    expect(await matches.literal(5).castPromise(5)).toBe(5);
  });
  test("some should only return the unique", () => {
    expect(
      matches
        .some(matches.number, matches.literal("test"), matches.number)
        .apply("hello").value
    ).toBe("some(isNumber(hello), literal[test](hello))");
  });
  test("some should only return the unique", () => {
    expect(
      matches.some(matches.number, matches.number).apply("hello").value
    ).toBe("isNumber(hello)");
  });

  test("should guard without a name", () => {
    expect(matches.guard(x => Number(x) > 3).unsafeCast(6)).toBe(6);
  });
  test("should guard without a name failure", () => {
    expect(
      matches
        .guard(x => Number(x) > 3)
        .apply(2)
        .toString()
    ).toMatchInlineSnapshot(`"left(test(2))"`);
  });

  test("should be able to test is object for event", () => {
    const event = new Event("test");
    expect(matches.object.apply(event).value).toBe(event);
  });

  test("should fail on a circular object", () => {
    const o: any = {};
    o.o = o;
    expect(matches.isFunction.apply(o).value).toMatchInlineSnapshot(
      `"isFunction([object Object])"`
    );
  });

  test("should be able to map validation", () => {
    const testString = "test";
    const event = new Event(testString);
    const isEvent = matches.guard(
      (x: unknown): x is Event => x instanceof Event,
      "isEvent"
    );
    expect(isEvent.map(x => x.type).apply(event).value).toBe(testString);
  });

  describe("with a number.maybe matcher", () => {
    const maybeNumber = matches.number.maybe();

    test("a number in", () => {
      const input = 4;
      const expected = Right.of(Some.of(4));
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
    test("a null in", () => {
      const input = null;
      const expected = Right.of(None.of);
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
    test("a undefined in", () => {
      const input = undefined;
      const expected = Right.of(None.of);
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
    test("a object in", () => {
      const input = {};
      const expected = Left.of("isNumber([object Object])");
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
  });

  describe("with a number.defaultTo matcher", () => {
    const maybeNumber = matches.number.defaultTo(0);

    test("a number in", () => {
      const input = 4;
      const expected = Right.of(4);
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
    test("a null in", () => {
      const input = null;
      const expected = Right.of(0);
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
    test("a undefined in", () => {
      const input = undefined;
      const expected = Right.of(0);
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
    test("a object in", () => {
      const input = {};
      const expected = Left.of("isNumber([object Object])");
      expect("" + maybeNumber.apply(input)).toBe("" + expected);
    });
  });

  describe("Testing as a filter", () => {
    it("should be able to utilize the test in a filter for typing", () => {
      expect([0, "hi", 5, {}].filter(matches.number.test)).toEqual([0, 5]);
    });
  });
});
