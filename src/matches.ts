import {
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

export interface ChainMatches<Values, OutcomeType = never> {
  when<Args extends Values extends never ? never : unknown[]>(
    ...args: Args
  ): ChainMatches<
    Exclude<Values, WhenInput<Args>>,
    OutcomeType | WhenOutput<Args>
  >;
  defaultTo<B>(value: B): B | OutcomeType;
  defaultToLazy<B>(getValue: () => B): B | OutcomeType;
  unwrap(): OutcomeType;
}
export { Parser as Validator, ValidatorError };

// prettier-ignore
export type ValueOrFunction<A, Input> = 
A extends (() => infer B) ? B :
  A extends ((input: infer InputB) => infer B) ? (
    InputB extends Input ? B : never) :
  A extends Function ? never :
  A
// prettier-ignore
export type ParserOrLiteral<A> = 
  A extends Parser<unknown, infer B> ? B :
  A
// prettier-ignore
export type WhenOutput<A extends unknown[]> = 
  A extends [] ? never :
  A extends [infer B] ? (
    ValueOrFunction<B, never>
  ) :
  A extends [infer B, infer C] ? ValueOrFunction<C, ParserOrLiteral<B>> :
  A extends [infer B, infer C, infer D] ? ValueOrFunction<D, ParserOrLiteral<B> | ParserOrLiteral<C>> :
  A extends [infer B, infer C,...infer Betweens, infer D] ? WhenOutput<[ParserOrLiteral<B> | ParserOrLiteral<C>, Betweens,D]> :
  never
// prettier-ignore
export type WhenInput<A extends unknown[]> = 
    A extends [] ? never :
    A extends [infer B] ? any :
    A extends [infer B, unknown] ? ParserOrLiteral<B> :
    A extends [infer B, infer C, unknown] ? ParserOrLiteral<B> | ParserOrLiteral<C> :
    A extends [infer B, infer C,...infer Betweens, unknown] ? WhenInput<[ParserOrLiteral<B> | ParserOrLiteral<C>, Betweens,unknown]> :
    never

export type ExtendsSimple<A> = A extends
  | string
  | number
  | boolean
  | null
  | undefined
  ? A
  : never;
class Matched<Ins, OutcomeType> implements ChainMatches<Ins, OutcomeType> {
  constructor(private value: OutcomeType) {}
  when<Args extends Ins extends never ? never : unknown[]>(
    ..._args: Args
  ): ChainMatches<
    Exclude<Ins, WhenInput<Args>>,
    OutcomeType | WhenOutput<Args>
  > {
    return this as any;
  }
  defaultTo<B>(_defaultValue: B) {
    return this.value;
  }
  defaultToLazy<B>(_getValue: () => B) {
    return this.value;
  }
  unwrap(): OutcomeType {
    return this.value;
  }
}

class MatchMore<Ins, OutcomeType> implements ChainMatches<Ins, OutcomeType> {
  constructor(private a: unknown) {}

  when<Args extends Ins extends never ? never : unknown[]>(
    ...args: Args
  ): ChainMatches<
    Exclude<Ins, WhenInput<Args>>,
    OutcomeType | WhenOutput<Args>
  > {
    const [outcome, ...matchers] = args.reverse();
    const me = this;
    const parser = matches.some(
      ...matchers.map((matcher) =>
        matcher instanceof Parser ? matcher : literal(matcher as any)
      )
    );
    return parser.parse(this.a, {
      parsed(value: unknown) {
        if (outcome instanceof Function) {
          return new Matched(outcome(value));
        }
        return new Matched(outcome);
      },
      invalid(_) {
        return me;
      },
    }) as any;
  }

  defaultTo<B>(value: B) {
    return value;
  }

  defaultToLazy<B>(getValue: () => B) {
    return getValue();
  }

  unwrap(): OutcomeType {
    throw new Error("Expecting that value is matched");
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
  function matchesFn<Ins extends unknown>(value: Ins) {
    return new MatchMore<Ins, never>(value);
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
