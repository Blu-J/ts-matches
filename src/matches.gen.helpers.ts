import matches from "./matches";
import { Parser } from "./parsers";
import { saferStringify } from "./utils";
import { validatorError } from "./matches.test";
import { fc } from "@fast-check/jest";

export interface ChainMatches<OutcomeType> {
  when<B>(
    test: Parser<unknown, B>,
    thenFn: (b: B) => OutcomeType,
  ): ChainMatches<OutcomeType>;
  defaultTo(value: OutcomeType): OutcomeType;
  defaultToLazy(getValue: () => OutcomeType): OutcomeType;
}

export const noPossibleCounter = {
  noPossibleCounter: true,
};

export const matchPairOf = <A>(
  matcher: Parser<unknown, A>,
  example: A,
  type: string,
  counterExample: any,
) => ({
  matcher,
  type,
  example,
  counterExample,
  toString() {
    return `{
      matcher: ${Parser.parserAsString(this.matcher)},
      example: ${saferStringify(this.example)},
      type: ${this.type},
      counterExample: ${saferStringify(this.counterExample)},
    }`;
  },
});

export type MatchPair<A> = {
  matcher: Parser<unknown, A>;
  example: A;
  type: string;
  counterExample: any;
};

const matcherPairsSimple = (() => {
  const trueFloat = fc
    .tuple(fc.oneof(fc.constant(0), fc.float()), fc.integer())
    .map(([x, y]) => x + y);
  const matcherNumber = fc
    .record({
      example: trueFloat,
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined),
        fc.string(),
        fc.object(),
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.number, example, "number", counterExample),
    );
  const matcherNill = fc
    .record({
      example: fc.constantFrom(null, undefined),
      counterExample: fc.oneof<any>(fc.string(), fc.object(), fc.integer()),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.nill, example, "nill", counterExample),
    );
  const matcherNat = fc
    .record({
      example: fc.nat(),
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined),
        fc.string(),
        fc.object(),
        fc
          .nat()
          .filter((x) => x !== 0)
          .map((x) => -x),
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.natural, example, "natural number", counterExample),
    );
  const matcherObject = fc
    .record({
      example: fc.object(),
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined),
        fc.string(),
        trueFloat,
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.object, example, "object", counterExample),
    );

  fc.boolean(), fc.integer(), fc.string();
  const matcherFunction = fc
    .record({
      example: fc.constant(() => {}),
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined),
        fc.string(),
        fc.object(),
        trueFloat,
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.isFunction, example, "function", counterExample),
    );
  const matcherBoolean = fc
    .record({
      example: fc.boolean(),
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined),
        fc.string(),
        fc.object(),
        trueFloat,
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.boolean, example, "boolean", counterExample),
    );
  const matcherArray = fc
    .record({
      example: fc.array(fc.anything()),
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined, {}),
        fc.string(),
        trueFloat,
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.array, example, "array", counterExample),
    );
  const matcherAny = fc
    .anything()
    .map((x) => matchPairOf(matches.any, x, "any", noPossibleCounter));
  const matcherString = fc
    .record({
      example: fc.string(),
      counterExample: fc.oneof<any>(
        fc.constantFrom(null, undefined),
        fc.object(),
        trueFloat,
      ),
    })
    .map(({ example, counterExample }) =>
      matchPairOf(matches.string, example, "string", counterExample),
    );

  const matcherConstant = fc
    .oneof<
      fc.Arbitrary<{
        example: boolean | string | number;
        counterExample: any;
      }>[]
    >(
      fc.record({
        example: fc.boolean(),
        counterExample: fc.oneof<any>(
          fc.constantFrom(null, undefined),
          fc.string(),
          trueFloat,
        ),
      }),
      fc.record({
        example: fc.string(),
        counterExample: fc.oneof<any>(
          fc.constantFrom(null, undefined),
          trueFloat,
          fc.boolean(),
        ),
      }),
      fc.record({
        example: trueFloat,
        counterExample: fc.oneof<any>(
          fc.constantFrom(null, undefined),
          fc.string(),
          fc.boolean(),
        ),
      }),
    )
    .map(({ example, counterExample }) =>
      matchPairOf(
        matches.literal(example),
        example,
        `literal of ${saferStringify(example)}`,
        counterExample,
      ),
    );

  const matchesLiteral = fc
    .oneof<
      fc.Arbitrary<{
        example: boolean | string | number;
        counterExample: any;
      }>[]
    >(
      fc.record({
        example: fc.boolean(),
        counterExample: fc.oneof<any>(
          fc.constantFrom(null, undefined),
          fc.string(),
          trueFloat,
        ),
      }),
      fc.record({
        example: fc.string(),
        counterExample: fc.oneof<any>(
          fc.constantFrom(null, undefined),
          trueFloat,
          fc.boolean(),
        ),
      }),
      fc.record({
        example: trueFloat,
        counterExample: fc.oneof<any>(
          fc.constantFrom(null, undefined),
          fc.string(),
          fc.boolean(),
        ),
      }),
    )
    .map(({ example, counterExample }) =>
      matchPairOf(
        matches.literal(example),
        example,
        `literal of ${saferStringify(example)}`,
        counterExample,
      ),
    );
  type Constructor<A> = {
    new (...args: any[]): A;
  };
  class TestBase {}
  const constructors: Constructor<any>[] = [
    class Test {},
    class Test2 extends TestBase {},
    class Test3 {},
  ];

  const matcherInstanceOf = fc
    .constantFrom(...constructors)
    .chain((Cons) =>
      fc.record({
        example: fc.constant(new Cons()),
        matcher: fc.constant(matches.instanceOf(Cons)),
        type: fc.constant(`instanceOf ${Cons.name}`),
        counterExample: fc.constantFrom(
          ...constructors.filter((x) => x != Cons),
        ),
      }),
    )
    .map((base) =>
      matchPairOf(base.matcher, base.example, base.type, base.counterExample),
    );
  return fc.oneof<fc.Arbitrary<MatchPair<any>>[]>(
    matcherNumber,
    matcherFunction,
    matcherInstanceOf,
    matcherObject,
    matcherConstant,
    matcherBoolean,
    matchesLiteral,
    matcherArray,
    // matcherAny,
    matcherString,
    matcherNat,
    matcherNill,
  );
})();

const matcherSome = fc
  .array(matcherPairsSimple)
  .filter((x) => x.length > 0)
  .chain((matchers) =>
    fc.integer({ min: 0, max: matchers.length - 1 }).map((atIndex) => ({
      atIndex,
      matchers,
    })),
  )
  .map(({ atIndex, matchers }) => {
    return matchPairOf(
      (matches.some as any)(...matchers.map((x) => x.matcher)),
      matchers[atIndex].example,
      `some (${matchers.map((x) => x.type).join(", ")})`,
      noPossibleCounter,
    );
  });

const matcherArrayOf = matcherPairsSimple.chain((pair) =>
  fc.array(fc.constant(pair)).map((pairs) => {
    const validCounter =
      !!pairs.length &&
      pairs.every((x) => x.counterExample !== noPossibleCounter);
    return matchPairOf(
      matches.arrayOf(pair.matcher),
      pairs.map((x) => x.example),
      `arrayOf ${pair.type}`,
      validCounter ? pairs.map((x) => x.counterExample) : null,
    );
  }),
);

export const matcherTuple = fc.array(matcherPairsSimple).map((xs) => {
  const validCounter =
    !!xs.length && xs.every((x) => x.counterExample !== noPossibleCounter);
  return matchPairOf(
    matches.tuple(...xs.map((tupleValue) => tupleValue.matcher)),
    xs.map((x) => x.example) as any,
    `tuple ${saferStringify(xs.map((x) => x.type))}`,
    validCounter ? xs.map((x) => x.counterExample) : 0,
  );
});

const matcherShape = fc.dictionary(fc.string(), matcherPairsSimple).map((x) => {
  type testingShape = { [key in keyof typeof x]: (typeof x)[key]["example"] };
  const matcher: Parser<unknown, testingShape> = matches.shape(
    Object.keys(x).reduce(
      (
        acc: { [key in keyof typeof x]: (typeof x)[key]["matcher"] },
        key: keyof typeof x,
      ) => {
        const value = x[key];
        acc[key] = value.matcher;
        return acc;
      },
      {},
    ),
  );
  const example: testingShape = Object.keys(x).reduce(
    (
      acc: { [key in keyof typeof x]: (typeof x)[key]["example"] },
      key: keyof typeof x,
    ) => {
      const value = x[key];
      acc[key] = value.example;
      return acc;
    },
    {},
  );
  const type: string = `shape of ${saferStringify(
    Object.keys(x).reduce(
      (acc: { [key in keyof typeof x]: string }, key: keyof typeof x) => {
        const value = x[key];
        acc[key] = value.type;
        return acc;
      },
      {},
    ),
  )}`;
  const counterExample: testingShape = Object.keys(x).reduce(
    (
      acc: { [key in keyof typeof x]: (typeof x)[key]["example"] },
      key: keyof typeof x,
    ) => {
      const value = x[key];
      acc[key] = value.counterExample;
      return acc;
    },
    {},
  );

  const validCounter =
    !!Object.keys(x).length &&
    Object.values(x).every((x) => x.counterExample !== noPossibleCounter);

  return matchPairOf(matcher, example, type, validCounter ? counterExample : 0);
});

const matcherShapePartial = fc
  .dictionary(fc.string(), matcherPairsSimple)
  .map((x) => {
    type testingShape = Partial<{
      [key in keyof typeof x]: (typeof x)[key]["example"];
    }>;
    const matcher: Parser<unknown, testingShape> = matches.partial(
      Object.keys(x).reduce(
        (
          acc: { [key in keyof typeof x]: (typeof x)[key]["matcher"] },
          key: keyof typeof x,
        ) => {
          const value = x[key];
          acc[key] = value.matcher;
          return acc;
        },
        {},
      ),
    );
    const example: testingShape = Object.keys(x).reduce(
      (
        acc: { [key in keyof typeof x]: (typeof x)[key]["example"] },
        key: keyof typeof x,
      ) => {
        const value = x[key];
        acc[key] = value.example;
        return acc;
      },
      {},
    );
    const type: string = `shape of ${saferStringify(
      Object.keys(x).reduce(
        (acc: { [key in keyof typeof x]: string }, key: keyof typeof x) => {
          const value = x[key];
          acc[key] = value.type;
          return acc;
        },
        {},
      ),
    )}`;
    const validCounter =
      !!Object.keys(x).length &&
      Object.values(x).every((x) => x.counterExample !== noPossibleCounter);
    const counterExample: testingShape = Object.keys(x).reduce(
      (
        acc: { [key in keyof typeof x]: (typeof x)[key]["example"] },
        key: keyof typeof x,
      ) => {
        const value = x[key];
        acc[key] = value.counterExample;
        return acc;
      },
      {},
    );

    return matchPairOf(
      matcher,
      example,
      type,
      validCounter ? counterExample : 0,
    );
  });

export const matcherPairs: fc.Arbitrary<ReturnType<typeof matchPairOf>> =
  fc.oneof(
    matcherPairsSimple,
    matcherShape,
    matcherTuple,
    matcherArrayOf,
    matcherShapePartial,
    matcherSome,
  );

export const testSetupInformation = <A>(
  matchPair: ReturnType<typeof matchPairOf>,
) => ({
  ...matchPair,
  matchValue: {},
});

export type TestSetup = {
  defaultValue: {};
  setupInformation: {
    matchValue: {};
    matcher: Parser<unknown, unknown>;
    type: string;
    example: unknown;
    counterExample: any;
    toString(): string;
  }[];
  runMatch: (x: unknown) => unknown;
  runMatchLazy: (x: unknown) => unknown;
  randomExample: {
    value: any;
    counter: any;
    index: number;
  };
  toString(): string;
};

export const testSetup = fc.array(matcherPairs).chain((matcherPairsSets) => {
  const defaultValue = {};
  const defaultTest = {
    defaultValue,
    setupInformation: [] as [],
    runMatch: (x: unknown) => matches(x).defaultTo(-1),
    runMatchLazy: (x: unknown) => matches(x).defaultToLazy(() => -1),
    randomExample: {
      value: defaultValue,
      counter: noPossibleCounter as any,
      index: -1,
    },
    toString() {
      return `{
        matching: ${saferStringify(matcherPairsSets.map((x) => x.matcher).map((x) => Parser.parserAsString(x)))},
        defaultValue: ${saferStringify(this.defaultValue)},
        randomExample: {
          value: ${saferStringify(this.randomExample.value)},
          counter: ${saferStringify(this.randomExample.counter)},
          index: ${this.randomExample.index},
        },
      }`;
    },
  };
  if (!matcherPairsSets.length) {
    return fc.constant(defaultTest);
  }
  const setupInformation = matcherPairsSets.reduce(
    (acc: ReturnType<typeof testSetupInformation>[], value) => {
      acc.push(testSetupInformation(value));
      return acc;
    },
    [],
  );
  return fc.nat(matcherPairsSets.length).map((randomExampleIndex) => {
    if (randomExampleIndex === matcherPairsSets.length) {
      return defaultTest;
    }
    const randomExample = {
      value: setupInformation[randomExampleIndex].example,
      counter: setupInformation[randomExampleIndex].counterExample,
      index: randomExampleIndex,
    };
    return {
      defaultValue,
      setupInformation,
      runMatch: (x: unknown) =>
        setupInformation
          .reduce(
            (acc: ChainMatches<unknown>, { matcher, matchValue }, index) =>
              acc.when(matcher, () => index),
            matches(x),
          )
          .defaultTo(-1),
      runMatchLazy: (x: unknown) =>
        setupInformation
          .reduce(
            (acc: ChainMatches<unknown>, { matcher, matchValue }, index) =>
              acc.when(matcher, () => index),
            matches(x),
          )
          .defaultToLazy(() => -1),
      randomExample,
      toString() {
        return `{
          matching: ${saferStringify(matcherPairsSets.map((x) => Parser.parserAsString(x.matcher)))},
          defaultValue: ${saferStringify(defaultValue)},
          randomExample: {
            value: ${saferStringify(randomExample.value)},
            counter: ${saferStringify(randomExample.counter)},
            index: ${randomExample.index},
          },
        }`;
      },
    };
  });
});
