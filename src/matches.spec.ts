import matches from "./matches";
import fc from "fast-check";
import * as gens from "./matches.gen";
import { Parser, any, every, number, partial, shape } from "./parsers";
import { saferStringify } from "./utils";

const isNumber = (x: unknown): x is number => typeof x === "number";

export const validatorError = every(
  shape({
    name: matches.string,
    value: any,
  })
);

const unFold = {
  invalid: Parser.validatorErrorAsString,
  parsed: (x: any): any => x,
};
const stringFold = {
  invalid: (x: any): any => `invalid(${saferStringify(x)})`,
  parsed: (x: any): any => `parsed(${saferStringify(x)})`,
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
      expect(() =>
        matches(testValue)
          .when(2, () => 2 as const)
          .unwrap()
      ).toThrowError();
    });
    test("default literal", () => {
      expect(matches(5).when("5").unwrap()).toEqual("5");
    });
    test("testing type inferencing of matching", () => {
      matches(5 as const)
        // @ts-expect-error Error is that 6 is not a subset 2
        .when(2, (a: 6) => 1 as const)
        // @ts-expect-error Error is that 6 is not a subset 2
        .when(matches.literal(2), (a: 6) => 2 as const)
        .when(matches.literal(6), (a: 6) => 3 as const)
        .when(2, 5, (a: 5 | 2) => a)
        // @ts-expect-error Should be never since all cases are covered
        .when(2, 5, (a: 5 | 2) => a)
        .defaultTo(0);
      matches("test")
        .when("string", "a")
        .when(matches.string, "b")
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
    test("a matcher defaulted will always be a function to Either of the same type (not nil) or ValidationError on error", () => {
      fc.assert(
        fc.property(
          gens.matcherPairs.filter((x) => x.example != null),
          fc.anything(),
          (pair, example) => {
            pair.matcher.defaultTo(pair.example).parse(example, {
              invalid: (value) => {
                validatorError.unsafeCast(value);
              },
              parsed: (value) => {
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
            matcher.parse(example, {
              invalid: () => {
                expect(matcher.test(example)).toBe(false);
              },
              parsed: () => {
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
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });
    test("should fail for missing key", () => {
      const testValue = {};
      const validator = matches.shape({ a: matches.any });
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"a\\"]isAnything(\\"missingProperty\\")"`
      );
    });

    test("should be able to test shape with failure", () => {
      const testValue = { a: "c" };
      const validator = matches.shape({ a: matches.literal("b") });
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"a\\"]isLiteral_\\"b\\"(\\"c\\")"`
      );
    });

    test("should be able to test shape with failure: not object", () => {
      const testValue = 5;
      const validator = matches.shape({ a: matches.literal("b") });
      expect(validator.parse(testValue, unFold)).toEqual(
        `isObject(${saferStringify(testValue)})`
      );
    });

    test("should be able to test shape with failure", () => {
      const testValue = {};
      const validator = matches.shape({
        a: matches.literal("b"),
        b: matches.literal("b"),
      });
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"a\\"]isLiteral_\\"b\\"(\\"missingProperty\\")"`
      );
    });
    test("should be able to test shape with failure smaller", () => {
      const testValue = { a: "b" };
      const validator = matches.shape({
        a: matches.literal("b"),
        b: matches.literal("b"),
      });
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"b\\"]isLiteral_\\"b\\"(\\"missingProperty\\")"`
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
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"a\\"]isLiteral_\\"c\\"(\\"a\\")"`
      );
    });
    test("should be able to test partial shape failure smaller", () => {
      const testValue = { b: "b" };
      const validator = matches.partial({
        a: matches.literal("c"),
        b: matches.literal("c"),
      });
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"b\\"]isLiteral_\\"c\\"(\\"b\\")"`
      );
    });

    test("should be able to test literal", () => {
      const testValue = "a";
      const validator = matches.literal("a");
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be able to test literal with failure", () => {
      const testValue = "a";
      const validator = matches.literal("b");
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isLiteral_\\"b\\"(\\"a\\")"`
      );
    });

    test("should be able to test number", () => {
      const testValue = 4;
      const validator = matches.number;
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be able to test number with failure", () => {
      const testValue = "a";
      const validator = matches.number;
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isNumber(\\"a\\")"`
      );
    });

    test("should be able to test string", () => {
      const testValue = "a";
      const validator = matches.string;
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be able to test string with failure", () => {
      const testValue = 5;
      const validator = matches.string;
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isString(5)"`
      );
    });

    test("should be able to test regex", () => {
      const testValue = "test";
      const validator = matches.regex(/test/);
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be able to test regex with failure", () => {
      const testValue = "Invalid";
      const validator = matches.regex(/test/);
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"/test/(\\"Invalid\\")"`
      );
    });

    test("should be able to test isFunction", () => {
      const testValue = () => ({});
      const validator = matches.isFunction;
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be able to test isFunction with failure", () => {
      const testValue = "test";
      const validator = matches.isFunction;
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isFunction(\\"test\\")"`
      );
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
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isBoolean(0)"`
      );
    });

    test("should be able to test boolean falsy with failure", () => {
      const testValue = "test";
      const validator = matches.boolean;
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isBoolean(\\"test\\")"`
      );
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
      expect(validator.parse(testValue, unFold)).toEqual("isObject(5)");
    });

    test("should be able to test tuple(number, string)", () => {
      const testValue = [4, "test"];
      const validator = matches.tuple([matches.number, matches.string]);
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be able to test tuple(number, string) with failure", () => {
      const testValue = ["bad", 5];
      const validator = matches.tuple([matches.number, matches.string]);
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[\\"0\\"]isNumber(\\"bad\\")"`
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
      expect(validator.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should be fallible union several matchers", () => {
      const testValue = false;
      const validator = matches.some(matches.number, matches.string);
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"...||isNumber(false)"`
      );
    });

    test("should intersection several matchers", () => {
      const testValue = 4;
      const isEven = matches.guard(
        (x: unknown): x is number => isNumber(x) && x % 2 === 0,
        "isEven"
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
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isString(5)"`
      );
    });
    test("should be fallible union several matchers", () => {
      const testValue = 5;
      const isEven = matches.guard(
        (x: unknown): x is number => isNumber(x) && x % 2 === 0,
        "isEven"
      );
      const isGt6 = matches.guard(
        (x: unknown): x is number => isNumber(x) && x > 6,
        "isGt6"
      );
      const validator = matches.every(matches.number, isEven, isGt6);
      expect(validator.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isEven(5)"`
      );
    });

    test("should have array of test", () => {
      const testValue = [5, 5, 5];
      const arrayOf = matches.arrayOf(matches.literal(5));
      expect(arrayOf.parse(testValue, unFold)).toEqual(testValue);
    });
    test("should be able to match literals", () => {
      const matcher = matches.literals(4, "3");
      const firstExpectedOutcome: 4 | "3" = matcher.parse(4, unFold);
      expect(firstExpectedOutcome).toEqual(4);
      expect(matcher.parse("3", unFold)).toEqual("3");
      expect(matcher.parse(3, unFold)).toMatchInlineSnapshot(
        `"...||isLiteral_4(3)"`
      );
      expect(matcher.parse("4", unFold)).toMatchInlineSnapshot(
        `"...||isLiteral_4(\\"4\\")"`
      );
    });
    test("should have array of test fail", () => {
      const testValue = [5, 3, 2, 5, 5];
      const arrayOf = matches.arrayOf(matches.literal(5));
      expect(arrayOf.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"[1]isLiteral_5(3)"`
      );
    });

    test("should refinement matchers", () => {
      const testValue = 4;
      const isEven = matches.number.refine((num): num is number => {
        // Make sure that the refine types pass down the number
        let _test: number = num;
        // Asserting to typescript that the infered type not something else
        // @ts-expect-error
        let _test2: string = num;
        return num % 2 === 0;
      }, "isEven");
      expect(isEven.parse(testValue, unFold)).toEqual(testValue);
    });
    test("should valid matchers", () => {
      const testValue = 4;
      const isEven = matches.number.validate((num) => {
        // Make sure that the refine types pass down the number
        let _test: number = num;
        // Asserting to typescript that the infered type not something else
        // @ts-expect-error
        let _test2: string = num;
        return num % 2 === 0;
      }, "isEven");
      expect(isEven.parse(testValue, unFold)).toEqual(testValue);
    });

    test("should refinement matchers fail", () => {
      const testValue = 4;
      const isEven = matches.number.refine(
        (num: number): num is number => num % 2 === 0,
        "isEven"
      );
      expect(isEven.parse(testValue, stringFold)).toMatchInlineSnapshot(
        `"parsed(4)"`
      );
    });
    test("should refinement matchers fail", () => {
      const testValue = 5;
      const isEven = matches.number.refine(
        (num: number): num is number => num % 2 === 0,
        "isEven"
      );
      expect(isEven.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"isEven(5)"`
      );
    });
    test("should be able to rename", () => {
      const testValue = "5";
      const isEven = matches.number.withName("customName");
      expect(isEven.parse(testValue, unFold)).toMatchInlineSnapshot(
        `"customName(\\"5\\")"`
      );
    });

    test("should refinement matchers fail cleanup any", () => {
      const testValue = 5;
      const isEven = matches.any.refine(
        (num: any): num is number => num % 2 === 0,
        "isEven"
      );
      expect(() =>
        isEven.unsafeCast(testValue)
      ).toThrowErrorMatchingInlineSnapshot(`"isEven(5)}"`);
    });

    test("should throw on invalid unsafe match throw", () => {
      expect(() =>
        matches.partial({}).unsafeCast(5)
      ).toThrowErrorMatchingInlineSnapshot(`"isObject(5)}"`);
    });
    test("should throw on invalid unsafe match throw", async () => {
      try {
        await matches.partial({}).castPromise(5);
        expect("never").toBe("called");
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[TypeError: isObject(5)}]`);
      }
    });
    test("should throw on invalid unsafe match throw", async () => {
      expect(await matches.literal(5).castPromise(5)).toBe(5);
    });
    test("some should be any if empty", () => {
      expect(matches.some()).toEqual(matches.any);
    });
    test("some should only return the unique", () => {
      expect(
        matches
          .some(matches.number, matches.literal("test"), matches.number)
          .parse("hello", unFold)
      ).toMatchInlineSnapshot(`"...||isNumber(\\"hello\\")"`);
    });
    test("some should only return the unique", () => {
      expect(
        matches.some(matches.number, matches.number).parse("hello", unFold)
      ).toMatchInlineSnapshot(`"...||isNumber(\\"hello\\")"`);
    });

    test("should guard without a name", () => {
      expect(
        matches.guard((x): x is number => Number(x) > 3).unsafeCast(6)
      ).toBe(6);
    });
    test("should guard without a name failure", () => {
      expect(
        matches.guard((x): x is number => Number(x) > 3).parse(2, stringFold)
      ).toMatchInlineSnapshot(`"invalid({\\"value\\":2,\\"name\\":\\"\\"})"`);
    });

    test("should be able to test is object for event", () => {
      const event = new Event("test");
      expect(matches.object.parse(event, unFold)).toBe(event);
    });

    describe("testing is instance", () => {
      class Fake {
        constructor(readonly value: number) {}
      }
      it("should be able to validate it is a instance", () => {
        const value = new Fake(3);
        expect(matches.instanceOf(Fake).test(value)).toEqual(true);
        expect(matches.instanceOf(Fake).parse(value, unFold)).toEqual(value);
      });
      it("should be able to validate it is not a instance", () => {
        const value = {
          value: 4,
        };
        expect(matches.instanceOf(Fake).test(value)).toEqual(false);
        expect(
          matches.instanceOf(Fake).parse(value, unFold)
        ).toMatchInlineSnapshot(`"isFake({\\"value\\":4})"`);
      });
    });

    test("should fail on a circular object", () => {
      const o: any = {};
      o.o = o;
      expect(matches.isFunction.parse(o, unFold)).toMatchInlineSnapshot(
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
          .map((x) => {
            // Asserting to typescript that the infered type is event
            let _test: Event = x;
            // Asserting to typescript that the infered type not something else
            // @ts-expect-error
            let _test2: number = x;
            return x.type;
          })
          .parse(event, unFold)
      ).toBe(testString);
    });
    test("should be able to map validation with name", () => {
      const testString = "test";
      const event = new Event(testString);
      const isEvent = matches.guard(
        (x: unknown): x is Event => x instanceof Event,
        "isEvent"
      );
      expect(
        isEvent
          .map(function asType(x) {
            return x.type;
          })
          .parse(event, unFold)
      ).toBe(testString);
    });

    describe("with a number.maybe matcher", () => {
      const maybeNumber = matches.number.optional();

      test("a number in", () => {
        const input = 4;
        const expectedAnswer = 4;
        expect(maybeNumber.parse(input, unFold)).toBe(expectedAnswer);
      });
      test("a null in", () => {
        const input = null;
        expect(maybeNumber.parse(input, unFold)).toBe(null);
      });
      test("a undefined in", () => {
        const input = undefined;
        expect(maybeNumber.parse(input, unFold)).toBe(null);
      });
      test("a object in", () => {
        const input = {};
        expect(
          saferStringify(maybeNumber.parse(input, unFold))
        ).toMatchInlineSnapshot(`"\\"optional_isNumber({})\\""`);
      });
    });

    describe("with a number.defaultTo matcher", () => {
      const maybeNumber = matches.number.defaultTo(0);

      test("a number in", () => {
        const input = 4;
        const expected = 4;
        expect(maybeNumber.parse(input, unFold)).toBe(expected);
      });
      test("a null in", () => {
        const input = null;
        const expected = 0;
        expect(maybeNumber.parse(input, unFold)).toBe(expected);
      });
      test("a undefined in", () => {
        const input = undefined;
        const expected = 0;
        expect(maybeNumber.parse(input, unFold)).toBe(expected);
      });
      test("a object in", () => {
        const input = {};
        expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(
          `"optional_isNumber({})"`
        );
      });
    });

    describe("Testing as a filter", () => {
      it("should be able to utilize the test in a filter for typing", () => {
        expect([0, "hi", 5, {}].filter(matches.number.test)).toEqual([0, 5]);
      });
    });

    describe("Testing dictionaries", () => {
      const testMatcher = matches.dictionary(
        [matches.literal("test"), matches.literal("value")],
        [matches.literal("test2"), matches.literal("value2")]
      );
      it("should be able to check correct shape", () => {
        const input = { test: "value", test2: "value2" };
        const output: {
          test: "value";
          test2: "value2";
        } = testMatcher.unsafeCast(input);
        expect(output).toEqual(input);
      });
      it("should be able to check incorrect shape", () => {
        const input = { test: "invalid", test2: "value2" };
        const output = testMatcher.parse(input, unFold);
        expect(output).toMatchInlineSnapshot(
          `"...||[test]isLiteral_\\"value\\"({\\"key\\":\\"test\\",\\"value\\":\\"invalid\\"})"`
        );
      });
      it("should be able to check incorrect shape deep", () => {
        const input = [
          {
            second: "invalid",
          },
        ];
        const output = matches
          .tuple([
            matches.shape({
              second: matches.literal("valid"),
            }),
          ])
          .parse(input, unFold);
        expect(output).toMatchInlineSnapshot(
          `"[\\"0\\"][\\"second\\"]isLiteral_\\"valid\\"(\\"invalid\\")"`
        );
      });
      it("should be able to project values", () => {
        const input = { test: "value" };
        const output = matches
          .dictionary([
            matches.literal("test"),
            matches.literal("value").map((x) => `value2`),
          ])
          .unsafeCast(input);
        expect(output.test).toEqual("value2");
      });
      it("should be able to project keys", () => {
        const input = { test: "value" };
        const output = matches
          .dictionary([
            matches.literal("test").map((x) => "projected" as const),
            matches.literal("value"),
          ])
          .unsafeCast(input);
        expect(output.projected).toEqual("value");
      });
    });
  });
});
