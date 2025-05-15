import {
  any,
  arrayOf,
  boolean,
  deferred,
  dictionary,
  every,
  guard,
  instanceOf,
  isArray,
  isFunction,
  isNill,
  literal,
  literals,
  natural,
  number,
  object,
  Parser,
  partial,
  recursive,
  regex,
  shape,
  some,
  string,
  tuple,
  ValidatorError,
} from "./parsers/index";
import { parserName } from "./parsers/named";
import { unknown } from "./parsers/simple-parsers";
export type { IParser, ParserNames } from "./parsers/interfaces";

export { Parser as Validator };
export type { ValidatorError };

export type Fn<A, B> = (a: A) => B;
export type ValueOrFunction<In, Out> = ((a: In) => Out) | Out;

export type ParserOrLiteral<A> = ExtendsSimple<A> | Parser<unknown, A>;

export type Primative = string | number | boolean | null | undefined;
export type ExtendsSimple<A> =
  A extends string | number | boolean | null | undefined ? A : never;

export type WhenArgsExclude<A> =
  A extends [ValueOrFunction<infer T, infer V>] ?
    T extends unknown ?
      any
    : T
  : A extends (
    [...ParserOrLiteral<infer In>[], ValueOrFunction<infer In, infer Out>]
  ) ?
    In
  : never;

type _<A> = A;
type ExcludePrimative<A, B> = Exclude<A, Exclude<B, Exclude<A, B>>>;

type ValidWhenArg<A = never> =
  | Primative
  | Parser<unknown, unknown>
  | ValueOrFunction<A, unknown>;
export type WhenArgs<In, Out> =
  | [ValueOrFunction<In, Out>]
  | [...ParserOrLiteral<In>[], ValueOrFunction<In, Out>];

interface _WhenFn<In, Out> {
  <A, B>(
    ...args: WhenArgs<A, B>
  ): _<ChainMatches<ExcludePrimative<In, A>, Out | B>>;
}

export type WhenFn<In, Out> = [In] extends [never] ? never : _WhenFn<In, Out>;
export type WhenArgsOutput<A> =
  A extends [ValueOrFunction<infer T, infer V>] ? V
  : A extends (
    [...ParserOrLiteral<infer In>[], ValueOrFunction<infer In, infer Out>]
  ) ?
    Out
  : never;
export type UnwrapFn<In, OutcomeType> =
  [In] extends [never] ? () => OutcomeType : never;

export interface ChainMatches<In, OutcomeType = never> {
  when: WhenFn<In, OutcomeType>;
  defaultTo<B>(value: B): B | OutcomeType;
  defaultToLazy<B>(getValue: () => B): B | OutcomeType;
  unwrap: UnwrapFn<In, OutcomeType>;
}

class Matched<Ins, OutcomeType> implements ChainMatches<Ins, OutcomeType> {
  constructor(private value: OutcomeType) {}
  when: WhenFn<Ins, OutcomeType> = ((..._args: unknown[]) => {
    return this as unknown as any;
  }) as any;
  defaultTo<B>(_defaultValue: B) {
    return this.value;
  }
  defaultToLazy<B>(_getValue: () => B) {
    return this.value;
  }
  unwrap: UnwrapFn<Ins, OutcomeType> = ((): OutcomeType => {
    return this.value;
  }) as any;
}

class MatchMore<Ins, OutcomeType> implements ChainMatches<Ins, OutcomeType> {
  constructor(private a: unknown) {}
  when: WhenFn<Ins, OutcomeType> = ((...args: unknown[]) => {
    const [outcome, ...matchers] = args.reverse();
    const me = this;
    const P = Parser;
    const parserAsString = Parser.parserAsString;
    const parser = matches.some(
      ...matchers.map((matcher) =>
        Parser.isParser(matcher) ? matcher : literal(matcher as any),
      ),
    );
    const result = parser.enumParsed(this.a);
    if ("error" in result) {
      return me as any;
    }
    const { value } = result;
    if (outcome instanceof Function) {
      return new Matched(outcome(value)) as any;
    }
    return new Matched(outcome) as any;
  }) as any;

  defaultTo<B>(value: B) {
    return value;
  }

  defaultToLazy<B>(getValue: () => B) {
    return getValue();
  }

  unwrap: UnwrapFn<Ins, OutcomeType> = ((): OutcomeType => {
    throw new Error("Expecting that value is matched");
  }) as any;
}
const array: typeof arrayOf & Parser<unknown, unknown[]> = Object.assign(
  function arrayOfWrapper(...args: any) {
    return (arrayOf as any)(...args);
  },
  isArray,
) as any;

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
    array,
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
    unknown,
    any,
    boolean,
    dictionary,
    literals,
    nill: isNill,
    instanceOf,
    Parse: Parser,
    parserName,
    recursive,
    deferred,
  },
);

const nill = isNill;
const Parse = Parser;
const oneOf = some;
const anyOf = some;
const allOf = every;

export {
  allOf,
  any,
  anyOf,
  array,
  arrayOf,
  boolean,
  deferred,
  dictionary,
  every,
  guard,
  instanceOf,
  isFunction,
  literal,
  literals,
  natural,
  nill,
  number,
  object,
  oneOf,
  Parse,
  Parser,
  parserName,
  partial,
  recursive,
  regex,
  shape,
  some,
  string,
  tuple,
  unknown,
};
export default matches;
