import * as fc from "fast-check";
import matches, { Validator, ChainMatches } from "./matches";

export const matchPairOf = <A>(
  matcher: Validator<A>,
  example: A,
  type: string
) => ({
  matcher,
  type,
  example
});
const trueFloat = fc
  .tuple(fc.oneof(fc.constant(0), fc.float()), fc.integer())
  .map(([x, y]) => x + y);
const matcherNumber = trueFloat.map(x =>
  matchPairOf(matches.number, x, "number")
);
const matcherNat = fc
  .nat()
  .map(x => matchPairOf(matches.natural, x, "natural number"));
const matcherObject = fc
  .object()
  .map(x => matchPairOf(matches.object, x, "object"));
const matcherConstant = fc
  .oneof<boolean | string | number>(fc.boolean(), fc.integer(), fc.string())
  .map(x =>
    matchPairOf(matches.literal(x), x, `literal of ${JSON.stringify(x)}`)
  );
const matcherFunction = fc
  .constant(() => {})
  .map(x => matchPairOf(matches.isFunction, x, "function"));
const matcherBoolean = fc
  .boolean()
  .map(x => matchPairOf(matches.boolean, x, "boolean"));
const matcherArray = fc
  .array(fc.anything())
  .map(x => matchPairOf(matches.array, x, "array"));
const matcherAny = fc.anything().map(x => matchPairOf(matches.any, x, "any"));
const matcherString = fc
  .string()
  .map(x => matchPairOf(matches.string, x, "string"));
const matcherPairsSimple = fc.oneof<ReturnType<typeof matchPairOf>>(
  matcherNumber,
  matcherFunction,
  matcherObject,
  matcherConstant,
  matcherBoolean,
  matcherArray,
  matcherAny,
  matcherString,
  matcherNat
);
const matcherArrayOf = matcherPairsSimple.chain(pair =>
  fc
    .array(fc.constant(pair))
    .map(pairs =>
      matchPairOf(
        matches.arrayOf(pair.matcher),
        pairs.map(x => x.example),
        `arrayOf ${pair.type}`
      )
    )
);
const fillArray = <A>(length: number, fill: (i: number) => A) => {
  const answer: A[] = [];
  while (answer.length < length) {
    answer.push(fill(answer.length));
  }
  return answer;
};
const matcherTuple = fc
  .array(matcherPairsSimple)
  .filter(x => x.length > 0)
  .map(xs => {
    return matchPairOf(
      matches.tuple(xs.map(tupleValue => tupleValue.matcher) as any),
      xs.map(x => x.example),
      `tuple ${JSON.stringify(xs.map(x => x.type))}`
    );
  });
const matcherShape = fc.dictionary(fc.string(), matcherPairsSimple).map(x => {
  type testingShape = { [key in keyof typeof x]: (typeof x)[key]["example"] };
  const matcher: Validator<testingShape> = matches.shape(
    Object.entries(x).reduce(
      (
        acc: { [key in keyof typeof x]: (typeof x)[key]["matcher"] },
        [key, value]
      ) => {
        acc[key] = value.matcher;
        return acc;
      },
      {}
    )
  );
  const example: testingShape = Object.entries(x).reduce(
    (
      acc: { [key in keyof typeof x]: (typeof x)[key]["example"] },
      [key, value]
    ) => {
      acc[key] = value.example;
      return acc;
    },
    {}
  );
  const type: string = `shape of ${JSON.stringify(
    Object.entries(x).reduce(
      (acc: { [key in keyof typeof x]: string }, [key, value]) => {
        acc[key] = value.type;
        return acc;
      },
      {}
    )
  )}`;

  return matchPairOf(matcher, example, type);
});
export const matcherPairs = fc.oneof(
  matcherPairsSimple,
  matcherShape,
  matcherTuple,
  matcherArrayOf
);

export const testSetupInformation = <A>(
  matchPair: ReturnType<typeof matchPairOf>
) => ({
  ...matchPair,
  matchValue: {}
});
export const testSetup = fc.array(matcherPairs).chain(matcherPairsSets => {
  const defaultValue = {};
  const defaultTest = {
    defaultValue,
    setupInformation: [],
    runMatch: (x: unknown) => matches(x).defaultTo(defaultValue),
    randomExample: {
      value: defaultValue,
      index: -1
    }
  };
  if (!matcherPairsSets.length) {
    return fc.constant(defaultTest);
  }
  const setupInformation = matcherPairsSets.reduce(
    (acc: ReturnType<typeof testSetupInformation>[], value) => {
      acc.push(testSetupInformation(value));
      return acc;
    },
    []
  );
  return fc.nat(matcherPairsSets.length).map(randomExampleIndex => {
    if (randomExampleIndex === matcherPairsSets.length) {
      return defaultTest;
    }
    return {
      defaultValue,
      setupInformation,
      runMatch: (x: unknown) =>
        setupInformation
          .reduce(
            (acc: ChainMatches<unknown>, { matcher, matchValue }) =>
              acc.when(matcher, () => matchValue),
            matches(x)
          )
          .defaultTo(defaultValue),
      randomExample: {
        value: setupInformation[randomExampleIndex].example,
        index: randomExampleIndex
      }
    };
  });
});
