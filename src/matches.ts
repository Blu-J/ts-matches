import { Left, Right, Either } from "./either";
import { None, Some, Maybe } from "./maybe";
import {
  ChainMatches,
  Validator,
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
  boolean
} from "./validators";

export { Left, Right, Either, None, Some, Maybe };

class Matched<OutcomeType> implements ChainMatches<OutcomeType> {
  constructor(private value: OutcomeType) {}
  when<B>(
    fnTest: Validator<B>,
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

// tslint:disable-next-line:max-classes-per-file
class MatchMore<OutcomeType> implements ChainMatches<OutcomeType> {
  constructor(private a: unknown) {}

  when<B>(
    toValidEither: Validator<B>,
    thenFn: (b: B) => OutcomeType
  ): ChainMatches<OutcomeType> {
    const testedValue = toValidEither.apply(this.a);
    return testedValue.fold<ChainMatches<OutcomeType>>({
      left: () => this,
      right: value => new Matched<OutcomeType>(thenFn(value))
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
    nill: isNill
  }
);
export default matches;
