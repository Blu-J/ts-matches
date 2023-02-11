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
} from "./parsers/index.ts";
import { parserName } from "./parsers/named.ts";
import { unknown } from "./parsers/simple-parsers.ts";
export type { IParser, ParserNames } from "./parsers/interfaces.ts";

export { Parser as Validator };
export type { ValidatorError };

// prettier-ignore
export type Fn<A, B> = (a: A) => B;
export type ValueOrFunction<In, Out> = ((a: In) => Out) | Out;

// prettier-ignore
// deno-fmt-ignore
export type ParserOrLiteral<A> = ExtendsSimple<A> | Parser<unknown, A>

export type Primative = string | number | boolean | null | undefined;
export type ExtendsSimple<A> = A extends
  | string
  | number
  | boolean
  | null
  | undefined ? A
  : never;

// prettier-ignore
// deno-fmt-ignore
export type WhenArgsExclude<A> = 
 
  A extends [ValueOrFunction<infer T, infer V>] ? (
     // deno-lint-ignore no-explicit-any
    T extends unknown ? any : T
  ) :
  A extends [...ParserOrLiteral<infer In>[], ValueOrFunction<infer In, infer Out>] ? In :
  never

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
  <A, B>(...args: WhenArgs<A, B>): _<
    ChainMatches<ExcludePrimative<In, A>, Out | B>
  >;
}

export type WhenFn<In, Out> = [In] extends [never] ? never : _WhenFn<In, Out>;
// prettier-ignore
// deno-fmt-ignore
export type WhenArgsOutput<A> =  
  A extends [ValueOrFunction<infer T, infer V>] ? V :
  A extends [...ParserOrLiteral<infer In>[], ValueOrFunction<infer In, infer Out>] ? Out :
  never
export type UnwrapFn<In, OutcomeType> = [In] extends [never] ? () => OutcomeType
  : never;

export interface ChainMatches<In, OutcomeType = never> {
  when: WhenFn<In, OutcomeType>;
  defaultTo<B>(value: B): B | OutcomeType;
  defaultToLazy<B>(getValue: () => B): B | OutcomeType;
  unwrap: UnwrapFn<In, OutcomeType>;
}

class Matched<Ins, OutcomeType> implements ChainMatches<Ins, OutcomeType> {
  constructor(private value: OutcomeType) {}
  when: WhenFn<Ins, OutcomeType> = ((..._args: unknown[]) => {
    // deno-lint-ignore no-explicit-any
    return this as unknown as any;
    // deno-lint-ignore no-explicit-any
  }) as any;
  defaultTo<B>(_defaultValue: B) {
    return this.value;
  }
  defaultToLazy<B>(_getValue: () => B) {
    return this.value;
  }
  unwrap: UnwrapFn<Ins, OutcomeType> = ((): OutcomeType => {
    return this.value;
    // deno-lint-ignore no-explicit-any
  }) as any;
}

class MatchMore<Ins, OutcomeType> implements ChainMatches<Ins, OutcomeType> {
  constructor(private a: unknown) {}
  when: WhenFn<Ins, OutcomeType> = ((...args: unknown[]) => {
    const [outcome, ...matchers] = args.reverse();
    // deno-lint-ignore no-this-alias
    const me = this;
    const parser = matches.some(
      ...matchers.map((matcher) =>
        // deno-lint-ignore no-explicit-any
        matcher instanceof Parser ? matcher : literal(matcher as any)
      ),
    );
    const result = parser.enumParsed(this.a);
    if ("error" in result) {
      // deno-lint-ignore no-explicit-any
      return me as any;
    }
    const { value } = result;
    if (outcome instanceof Function) {
      // deno-lint-ignore no-explicit-any
      return new Matched(outcome(value)) as any;
    }
    // deno-lint-ignore no-explicit-any
    return new Matched(outcome) as any;
    // deno-lint-ignore no-explicit-any
  }) as any;

  defaultTo<B>(value: B) {
    return value;
  }

  defaultToLazy<B>(getValue: () => B) {
    return getValue();
  }

  unwrap: UnwrapFn<Ins, OutcomeType> = ((): OutcomeType => {
    throw new Error("Expecting that value is matched");
    // deno-lint-ignore no-explicit-any
  }) as any;
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

const array = isArray;
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
