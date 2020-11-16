import matches, { Right, Left, Some, None } from "./matches";
import fc from "fast-check";
import * as gens from "./matches.gen";
import { validatorError, Validator } from "./validators";
import { saferStringify } from "./utils";

const isNumber = (x: unknown): x is number => typeof x === "number";

const unFold = {
  left: (x: any): any => Validator.validatorErrorAsString(x),
  right: (x: any): any => x,
};
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
        fc.property(gens.testSetup, (testSetup) => {
          const indexOfMatchedValue = (value: any) =>
            testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatch(testSetup.randomExample.value)
          );
          expect(foundIndex).toBeLessThanOrEqual(testSetup.randomExample.index);
        })
      );
    });
    test("a matched lazy case will always be the equal to matcher or less than", () => {
      fc.assert(
        fc.property(gens.testSetup, (testSetup) => {
          const indexOfMatchedValue = (value: any) =>
            testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatchLazy(testSetup.randomExample.value)
          );
          expect(foundIndex).toBeLessThanOrEqual(testSetup.randomExample.index);
        })
      );
    });
    test("a counter matched case will never be the equal to matcher", () => {
      fc.assert(
        fc.property(gens.testSetup, (testSetup) => {
          const indexOfMatchedValue = (value: any) =>
            testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatch(testSetup.randomExample.counter)
          );
          if (testSetup.randomExample.counter !== gens.noPossibleCounter) {
            expect(foundIndex).not.toEqual(testSetup.randomExample.index);
          }
        })
      );
    });
    test("a counter matched lazy case will never be the equal to matcher", () => {
      fc.assert(
        fc.property(gens.testSetup, (testSetup) => {
          const indexOfMatchedValue = (value: any) =>
            testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatchLazy(testSetup.randomExample.counter)
          );
          if (testSetup.randomExample.counter !== gens.noPossibleCounter) {
            expect(foundIndex).not.toEqual(testSetup.randomExample.index);
          }
        })
      );
    });
    test("a matcher pair will always be able to cast it's example", () => {
      fc.assert(
        fc.property(gens.matcherPairs, ({ example, matcher }) => {
          matcher.unsafeCast(example);
        })
      );
    });
    test("a matcher pair will always be able to cast as promise it's example", () => {
      fc.assert(
        fc.asyncProperty(gens.matcherPairs, async ({ example, matcher }) => {
          await matcher.castPromise(example);
        })
      );
    });
    test("a matcher pair will always test it's example", () => {
      fc.assert(
        fc.property(gens.matcherPairs, ({ example, matcher }) =>
          matcher.test(example)
        )
      );
    });
    test("a matcher pair will never match it's counter example and throws", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs.filter(
            (x) => x.counterExample !== gens.noPossibleCounter
          ),
          ({ counterExample, matcher }) => {
            expect(() => matcher.unsafeCast(counterExample)).toThrow();
          }
        )
      );
    });
    test("a matcher will always be a function to Either of the same value or ValidatorError on error", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs,
          fc.anything(),
          ({ matcher }, example) => {
            const matchedValue = matcher.apply(example);
            matchedValue.fold({
              left: (value: any) => {
                validatorError.unsafeCast(value);
              },
              right: (value: any) => {
                expect(value).toEqual(example);
              },
            });
          }
        )
      );
    });
    test("a matcher defaulted will always be a function to Either of the same type (not nil) or ValidationError on error", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs.filter((x) => x.example != null),
          fc.anything(),
          (pair, example) => {
            const matchedValue = pair.matcher
              .defaultTo(pair.example)
              .apply(example);
            matchedValue.fold({
              left: (value: any) => {
                validatorError.unsafeCast(value);
              },
              right: (value: any) => {
                expect(value).not.toEqual(null);
                expect(value).not.toEqual(undefined);
              },
            });
          }
        )
      );
    });
    test("a matcher will will fold will always match the matcher test", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs,
          fc.anything(),
          ({ matcher }, example) => {
            const matchedValue = matcher.apply(example);
            matchedValue.fold({
              left: () => {
                expect(matcher.test(example)).toBe(false);
              },
              right: () => {
                expect(matcher.test(example)).toEqual(true);
              },
            });
          }
        )
      );
    });
    test("a matched value will not go to default", () => {
      fc.assert(
        fc.property(gens.testSetup, (testSetup) => {
          const indexOfMatchedValue = (value: unknown) =>
            testSetup.setupInformation
              .map((x) => x.matchValue)
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
    test("a matched lazy value will not go to default", () => {
      fc.assert(
        fc.property(gens.testSetup, (testSetup) => {
          const indexOfMatchedValue = (value: unknown) =>
            testSetup.setupInformation
              .map((x) => x.matchValue)
              .indexOf(value as any);
          const foundIndex = indexOfMatchedValue(
            testSetup.runMatchLazy(testSetup.randomExample.value)
          );
          if (testSetup.randomExample.index > -1) {
            expect(foundIndex).toBeGreaterThanOrEqual(0);
          }
        })
      );
    });
  });

  describe("snapshot testing", () => {
    test("should be able to test shape", () => {
      const testValue = { a: "c" };
      const validator = matches.shape({ a: matches.literal("c") });
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });
    test("should fail for missing key", () => {
      const testValue = {};
      const validator = matches.shape({ a: matches.any });
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"shape(hasProperty@a())"`
      );
    });

    test("should be able to test shape with failure", () => {
      const testValue = { a: "c" };
      const validator = matches.shape({ a: matches.literal("b") });
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"shape(@a(literal[b](\\"c\\")))"`
      );
    });

    test("should be able to test shape with failure: not object", () => {
      const testValue = 5;
      const validator = matches.shape({ a: matches.literal("b") });
      expect(validator.apply(testValue).fold(unFold)).toEqual(
        `isObject(${saferStringify(testValue)})`
      );
    });

    test("should be able to test shape with failure", () => {
      const testValue = {};
      const validator = matches.shape({
        a: matches.literal("b"),
        b: matches.literal("b"),
      });
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"shape(hasProperty@a(), hasProperty@b())"`
      );
    });

    test("should be able to test partial shape", () => {
      const testValue = {};
      const validator = matches.partial({ a: matches.literal("c") });
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test partial shape failure", () => {
      const testValue = { a: "a", b: "b" };
      const validator = matches.partial({
        a: matches.literal("c"),
        b: matches.literal("c"),
      });
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"partialShape(@a(literal[c](\\"a\\")), @b(literal[c](\\"b\\")))"`
      );
    });

    test("should be able to test literal", () => {
      const testValue = "a";
      const validator = matches.literal("a");
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test literal with failure", () => {
      const testValue = "a";
      const validator = matches.literal("b");
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"literal[b](\\"a\\")"`
      );
    });

    test("should be able to test number", () => {
      const testValue = 4;
      const validator = matches.number;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test number with failure", () => {
      const testValue = "a";
      const validator = matches.number;
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"isNumber(\\"a\\")"`
      );
    });

    test("should be able to test string", () => {
      const testValue = "a";
      const validator = matches.string;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test string with failure", () => {
      const testValue = 5;
      const validator = matches.string;
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"string(5)"`
      );
    });

    test("should be able to test regex", () => {
      const testValue = /test/;
      const validator = matches.regex;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test regex with failure", () => {
      const testValue = "test";
      const validator = matches.regex;
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"isRegExp(\\"test\\")"`
      );
    });

    test("should be able to test isFunction", () => {
      const testValue = () => ({});
      const validator = matches.isFunction;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test isFunction with failure", () => {
      const testValue = "test";
      const validator = matches.isFunction;
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"isFunction(\\"test\\")"`
      );
    });

    test("should be able to test boolean", () => {
      const testValue = true;
      const validator = matches.boolean;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test boolean false", () => {
      const testValue = false;
      const validator = matches.boolean;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test boolean with failure", () => {
      const testValue = 0;
      const validator = matches.boolean;
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"boolean(0)"`
      );
    });

    test("should be able to test boolean falsy with failure", () => {
      const testValue = "test";
      const validator = matches.boolean;
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"boolean(\\"test\\")"`
      );
    });

    test("should be able to test any", () => {
      const testValue = 0;
      const validator = matches.any;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test object", () => {
      const testValue = {};
      const validator = matches.object;
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test object with failure", () => {
      const testValue = 5;
      const validator = matches.object;
      expect(validator.apply(testValue).fold(unFold)).toEqual("isObject(5)");
    });

    test("should be able to test tuple(number, string)", () => {
      const testValue = [4, "test"];
      const validator = matches.tuple([matches.number, matches.string]);
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be able to test tuple(number, string) with failure", () => {
      const testValue = ["bad", 5];
      const validator = matches.tuple([matches.number, matches.string]);
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"shape(@0(isNumber(\\"bad\\")), @1(string(5)))"`
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
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be fallible union several matchers", () => {
      const testValue = false;
      const validator = matches.some(matches.number, matches.string);
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
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
      expect(validator.apply(testValue).fold(unFold)).toEqual(testValue);
    });

    test("should be fallible union several matchers", () => {
      const testValue = 5;
      const isEven = matches.guard(
        (x: unknown) => isNumber(x) && x % 2 === 0,
        "isEven"
      );
      const isGt6 = matches.guard(
        (x: unknown) => isNumber(x) && x > 6,
        "isGt6"
      );
      const validator = matches.every(matches.number, isEven, isGt6);
      expect(validator.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"isEven(5)"`
      );
    });

    test("should have array of test", () => {
      const testValue = [5, 5, 5];
      const arrayOf = matches.arrayOf(matches.literal(5));
      expect(arrayOf.apply(testValue).fold(unFold)).toEqual(testValue);
    });
    test("should have array of test fail", () => {
      const testValue = [5, 3, 2, 5, 5];
      const arrayOf = matches.arrayOf(matches.literal(5));
      expect(arrayOf.apply(testValue).fold(unFold)).toMatchInlineSnapshot(
        `"arrayOf(@1(literal[5](3)), @2(literal[5](2)))"`
      );
    });

    test("should refinement matchers", () => {
      const testValue = 4;
      const isEven = matches.number.refine(
        (num: number) => num % 2 === 0,
        "isEven"
      );
      expect(isEven.apply(testValue).fold(unFold)).toEqual(testValue);
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
      ).toThrowErrorMatchingInlineSnapshot(
        `"Failed type: isObject(5) given input 5"`
      );
    });
    test("should throw on invalid unsafe match throw", async () => {
      try {
        await matches.partial({}).castPromise(5);
        expect("never").toBe("called");
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          Object {
            "children": Array [],
            "name": "isObject",
            "value": 5,
          }
        `);
      }
    });
    test("should throw on invalid unsafe match throw", async () => {
      expect(await matches.literal(5).castPromise(5)).toBe(5);
    });
    test("some should only return the unique", () => {
      expect(
        matches
          .some(matches.number, matches.literal("test"), matches.number)
          .apply("hello")
          .fold(unFold)
      ).toMatchInlineSnapshot(
        `"some(isNumber(\\"hello\\"), literal[test](\\"hello\\"))"`
      );
    });
    test("some should only return the unique", () => {
      expect(
        matches.some(matches.number, matches.number).apply("hello").fold(unFold)
      ).toMatchInlineSnapshot(`"isNumber(\\"hello\\")"`);
    });

    test("should guard without a name", () => {
      expect(matches.guard((x) => Number(x) > 3).unsafeCast(6)).toBe(6);
    });
    test("should guard without a name failure", () => {
      expect(
        matches
          .guard((x) => Number(x) > 3)
          .apply(2)
          .toString()
      ).toMatchInlineSnapshot(
        `"left({\\"name\\":\\"test\\",\\"value\\":2,\\"children\\":[]})"`
      );
    });

    test("should be able to test is object for event", () => {
      const event = new Event("test");
      expect(matches.object.apply(event).fold(unFold)).toBe(event);
    });

    describe("testing is instance", () => {
      class Fake {
        constructor(readonly value: number) {}
      }
      it("should be able to validate it is a instance", () => {
        const value = new Fake(3);
        expect(matches.instanceOf(Fake).test(value)).toEqual(true);
        expect(matches.instanceOf(Fake).apply(value).fold(unFold)).toEqual(
          value
        );
      });
      it("should be able to validate it is not a instance", () => {
        const value = {
          value: 4,
        };
        expect(matches.instanceOf(Fake).test(value)).toEqual(false);
        expect(
          matches.instanceOf(Fake).apply(value).fold(unFold)
        ).toMatchInlineSnapshot(`"isFake({\\"value\\":4})"`);
      });
    });

    test("should fail on a circular object", () => {
      const o: any = {};
      o.o = o;
      expect(matches.isFunction.apply(o).fold(unFold)).toMatchInlineSnapshot(
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
      expect(
        isEvent
          .map((x) => x.type)
          .apply(event)
          .fold(unFold)
      ).toBe(testString);
    });

    describe("with a number.maybe matcher", () => {
      const maybeNumber = matches.number.maybe();

      test("a number in", () => {
        const input = 4;
        const expected = Right.of(Some.of(4));
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
      test("a null in", () => {
        const input = null;
        const expected = Right.of(None.of);
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
      test("a undefined in", () => {
        const input = undefined;
        const expected = Right.of(None.of);
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
      test("a object in", () => {
        const input = {};
        const expected = Left.of({
          name: "isNumber",
          value: {},
          children: [],
        });
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
    });

    describe("with a number.defaultTo matcher", () => {
      const maybeNumber = matches.number.defaultTo(0);

      test("a number in", () => {
        const input = 4;
        const expected = Right.of(4);
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
      test("a null in", () => {
        const input = null;
        const expected = Right.of(0);
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
      test("a undefined in", () => {
        const input = undefined;
        const expected = Right.of(0);
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
      test("a object in", () => {
        const input = {};
        const expected = Left.of({ name: "isNumber", value: {}, children: [] });
        expect(saferStringify(maybeNumber.apply(input))).toBe(
          saferStringify(expected)
        );
      });
    });

    describe("Testing as a filter", () => {
      it("should be able to utilize the test in a filter for typing", () => {
        expect([0, "hi", 5, {}].filter(matches.number.test)).toEqual([0, 5]);
      });
    });
  });
});
