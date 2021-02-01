import {
  ChainMatches,
  Parser,
  isArray,
  arrayOf,
  some,
  regex,
  number,
  natural,
  isFunction,
  shape,
  partial,
  literal,
  every,
  guard,
  any,
  isNill,
  tuple,
  object,
  string,
  boolean,
  instanceOf,
  ValidatorError,
  dictionary,
  literals,
} from "./parsers";

export { Parser as Validator, ChainMatches, ValidatorError };

class Matched<OutcomeType> implements ChainMatches<OutcomeType> {
  constructor(private value: OutcomeType) {}
  when<B>(
    fnTest: Parser<unknown, B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType> {
    return this as ChainMatches<OutcomeType>;
  }
  defaultTo(defaultValue: OutcomeType) {
    return this.value;
  }
  defaultToLazy(getValue: () => OutcomeType): OutcomeType {
    return this.value;
  }
}

class MatchMore<OutcomeType> implements ChainMatches<OutcomeType> {
  constructor(private a: unknown) {}

  when<B>(
    toValidEither: Parser<unknown, B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType> {
    const me = this;
    return toValidEither.parse(this.a, {
      parsed(value) {
        return new Matched<OutcomeType>(thenFn(value));
      },
      invalid(_) {
        return me;
      },
    });
  }

  defaultTo(value: OutcomeType) {
    return value;
  }

  defaultToLazy(getValue: () => OutcomeType): OutcomeType {
    return getValue();
  }
}

/**
 * Want to be able to bring in the declarative nature that a functional programming
 * language feature of the pattern matching and the switch statement. With the destructors
 * the only thing left was to find the correct structure then move move forward.
 * Using a structure in chainable fashion allows for a syntax that works with typescript
 * while looking similar to matches statements in other languages
 *
 * Use: matches('a value').when(matches.isNumber, (aNumber) => aNumber + 4).defaultTo('fallback value')
 */

export const matches = Object.assign(
  function matchesFn<Result>(value: unknown) {
    return new MatchMore<Result>(value);
  },
  {
    array: isArray,
    arrayOf,
    some,
    tuple,
    regex,
    number,
    natural,
    isFunction,
    object,
    string,
    shape,
    partial,
    literal,
    every,
    guard,
    any,
    boolean,
    dictionary,
    literals,
    nill: isNill,
    instanceOf,
    Parse: Parser,
  }
);
export default matches;
