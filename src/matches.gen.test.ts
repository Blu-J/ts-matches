import { test, fc } from "@fast-check/jest";
import {
  matcherPairs,
  matcherTuple,
  testSetup,
  noPossibleCounter,
  TestSetup,
} from "./matches.gen.helpers";
import { validatorError } from "./matches.test";

describe("properties", () => {
  test.prop([matcherTuple])(
    "given a tuple of matcher.test, a random example will always be matched by a parser before or equal to it's index",
    (pair) => {
      pair.matcher.unsafeCast(pair.example);
    },
  );
  test.prop([testSetup])(
    "given a list of matcher.test, a random example will always be matched by a parser before or equal to it's index",
    (testSetup: TestSetup) => {
      const matchArray = testSetup.setupInformation.map((x) => {
        try {
          return x.matcher.test(testSetup.randomExample.value);
        } catch (e) {
          return "Error";
        }
      });
      const foundIndex = matchArray.findIndex((x) => x === true);
      expect(foundIndex).toBeLessThanOrEqual(testSetup.randomExample.index);
    },
  );
  test.prop([testSetup])(
    "a matched lazy case will always be the equal to matcher or less than",
    (testSetup: TestSetup) => {
      if (testSetup.setupInformation.length === 0) return;
      const indexOfMatchedValue = (value: any) =>
        testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
      const foundIndex = testSetup.runMatchLazy(testSetup.randomExample.value);

      expect(foundIndex).toBeLessThanOrEqual(testSetup.randomExample.index);
    },
  );
  test.prop([testSetup])(
    "a counter matched case will never be the equal to matcher",
    (testSetup: TestSetup) => {
      if (testSetup.setupInformation.length === 0) return;
      const indexOfMatchedValue = (value: any) =>
        testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
      const foundIndex = indexOfMatchedValue(
        testSetup.runMatch(testSetup.randomExample.counter),
      );
      if (testSetup.randomExample.counter !== noPossibleCounter) {
        expect(foundIndex).not.toEqual(testSetup.randomExample.index);
      }
    },
  );
  test.prop([testSetup])(
    "a counter matched lazy case will never be the equal to matcher",
    (testSetup: TestSetup) => {
      const indexOfMatchedValue = (value: any) =>
        testSetup.setupInformation.map((x) => x.matchValue).indexOf(value);
      const foundIndex = indexOfMatchedValue(
        testSetup.runMatchLazy(testSetup.randomExample.counter),
      );
      if (testSetup.randomExample.counter !== noPossibleCounter) {
        expect(foundIndex).not.toEqual(testSetup.randomExample.index);
      }
    },
  );
  test.prop([matcherPairs])(
    "a matcher pair will always be able to cast it's example",
    ({ example, matcher }) => {
      matcher.unsafeCast(example);
    },
  );
  test.prop([matcherPairs])(
    "a matcher pair will always be able to cast as promise it's example",
    async ({ example, matcher }) => {
      await matcher.castPromise(example);
    },
  );
  test.prop([matcherPairs])(
    "a matcher pair will always test it's example",
    ({ example, matcher }) => {
      matcher.test(example);
    },
  );
  test.prop([
    matcherPairs.filter((x) => x.counterExample !== noPossibleCounter),
  ])(
    "a matcher pair will never match it's counter example and throws",
    ({ counterExample, matcher }) => {
      expect(() => matcher.unsafeCast(counterExample)).toThrow();
    },
  );

  test.prop([matcherPairs.filter((x) => x.example != null), fc.anything()])(
    "a matcher defaulted will always be a function to Either of the same type (not nil) or ValidationError on error",
    (pair, example) =>
      pair.matcher.mapVoid(pair.example).parse(example, {
        invalid: (value) => {
          validatorError.unsafeCast(value);
        },
        parsed: (value) => {
          expect(value).not.toEqual(null);
          expect(value).not.toEqual(undefined);
        },
      }),
  );
  test.prop([matcherPairs.filter((x) => x.example != null), fc.anything()])(
    "a matcher defaulted will always be a function to Either of the same type (not undefined) or ValidationError on error",
    (pair, example) =>
      pair.matcher.defaultTo(pair.example).parse(example, {
        invalid: (value) => {
          validatorError.unsafeCast(value);
        },
        parsed: (value) => {
          expect(value).not.toEqual(undefined);
        },
      }),
  );
  test.prop([matcherPairs.filter((x) => x.example != null), fc.anything()])(
    "a matcher defaulted will always be a function to Either of the same type (not null) or ValidationError on error",
    (pair, example) =>
      pair.matcher.mapNullish(pair.example).parse(example, {
        invalid: (value) => {
          validatorError.unsafeCast(value);
        },
        parsed: (value) => {
          expect(value).not.toEqual(null);
        },
      }),
  );

  test.prop([matcherPairs.filter((x) => x.example != null), fc.anything()])(
    "a matcher will will fold will always match the matcher test",
    ({ matcher }, example) => {
      matcher.parse(example, {
        invalid: () => {
          expect(matcher.test(example)).toBe(false);
        },
        parsed: () => {
          expect(matcher.test(example)).toEqual(true);
        },
      });
    },
  );

  test.prop([testSetup])(
    "a matcher will will fold will always match the matcher test",
    (testSetup: TestSetup) => {
      const foundIndex = testSetup.runMatch(testSetup.randomExample.value);
      if (testSetup.randomExample.index > -1) {
        expect(foundIndex).toBeGreaterThanOrEqual(0);
      }
    },
  );

  test.prop([testSetup])(
    "a matched value will not go to default",
    (testSetup: TestSetup) => {
      const foundIndex = testSetup.runMatch(testSetup.randomExample.value);
      if (testSetup.randomExample.index > -1) {
        expect(foundIndex).toBeGreaterThanOrEqual(0);
      }
    },
  );

  test.prop([testSetup])(
    "a matched lazy value will not go to default",
    (testSetup: TestSetup) => {
      const foundIndex = testSetup.runMatchLazy(testSetup.randomExample.value);
      if (testSetup.randomExample.index > -1) {
        expect(foundIndex).toBeGreaterThanOrEqual(0);
      }
    },
  );
});
