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

/**
 * Re-exports core types from the parser interfaces.
 */
export type { IParser, ParserNames } from "./parsers/interfaces";

/**
 * Re-exports the Parser class as Validator for backward compatibility.
 */
export { Parser as Validator };
export type { ValidatorError };

/**
 * A generic function type.
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 */
export type Fn<A, B> = (a: A) => B;

/**
 * Represents either a value or a function that produces that value.
 * @typeParam In - The input type for the function.
 * @typeParam Out - The output type.
 */
export type ValueOrFunction<In, Out> = ((a: In) => Out) | Out;

/**
 * Represents a parser or a literal value that can be used as a match argument.
 * @typeParam A - The expected type.
 */
export type ParserOrLiteral<A> = ExtendsSimple<A> | Parser<unknown, A>;

/**
 * Represents primitive TypeScript types.
 */
export type Primative = string | number | boolean | null | undefined;

/**
 * Extracts primitive types from `A`, or `never` if `A` is not primitive.
 * @typeParam A - The type to check.
 */
export type ExtendsSimple<A> =
  A extends string | number | boolean | null | undefined ? A : never;

/**
 * Extracts the input type from WhenArgs, handling both function and parser arguments.
 * @typeParam A - The WhenArgs type.
 */
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

/**
 * Identity type utility.
 * @typeParam A - The type to pass through.
 */
type _<A> = A;

/**
 * Excludes primitive types from `A` that are also in `B`.
 * @typeParam A - The type to exclude from.
 * @typeParam B - The type to exclude.
 */
type ExcludePrimative<A, B> = Exclude<A, Exclude<B, Exclude<A, B>>>;

/**
 * Valid arguments for the `.when()` method.
 * @typeParam A - The input type.
 */
type ValidWhenArg<A = never> =
  | Primative
  | Parser<unknown, unknown>
  | ValueOrFunction<A, unknown>;

/**
 * Represents the arguments for the `.when()` method.
 * @typeParam In - The input type.
 * @typeParam Out - The output type.
 */
export type WhenArgs<In, Out> =
  | [ValueOrFunction<In, Out>]
  | [...ParserOrLiteral<In>[], ValueOrFunction<In, Out>];

/**
 * Internal interface for the `.when()` method.
 * @typeParam In - The input type.
 * @typeParam Out - The output type.
 */
interface _WhenFn<In, Out> {
  <A, B>(
    ...args: WhenArgs<A, B>
  ): _<ChainMatches<ExcludePrimative<In, A>, Out | B>>;
}

/**
 * The type of the `.when()` method on a MatcherChain.
 * @typeParam In - The input type.
 * @typeParam Out - The output type.
 */
export type WhenFn<In, Out> = [In] extends [never] ? never : _WhenFn<In, Out>;

/**
 * Extracts the output type from WhenArgs.
 * @typeParam A - The WhenArgs type.
 */
export type WhenArgsOutput<A> =
  A extends [ValueOrFunction<infer T, infer V>] ? V
  : A extends (
    [...ParserOrLiteral<infer In>[], ValueOrFunction<infer In, infer Out>]
  ) ?
    Out
  : never;

/**
 * The type of the `.unwrap()` method on a MatcherChain.
 * @typeParam In - The input type.
 * @typeParam OutcomeType - The accumulated outcome type.
 */
export type UnwrapFn<In, OutcomeType> =
  [In] extends [never] ? () => OutcomeType : never;

/**
 * The interface for a chainable matcher result.
 * Provides `.when()`, `.defaultTo()`, `.defaultToLazy()`, and `.unwrap()` methods
 * for pattern matching expressions.
 * @typeParam In - The input type being matched.
 * @typeParam OutcomeType - The accumulated outcome type from previous `.when()` calls.
 */
export interface ChainMatches<In, OutcomeType = never> {
  when: WhenFn<In, OutcomeType>;
  defaultTo<B>(value: B): B | OutcomeType;
  defaultToLazy<B>(getValue: () => B): B | OutcomeType;
  unwrap: UnwrapFn<In, OutcomeType>;
}

/**
 * Represents a matched value (all cases have been exhausted).
 * @typeParam Ins - The input type.
 * @typeParam OutcomeType - The accumulated outcome type.
 */
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

/**
 * Represents a matcher chain that can still match more cases.
 * @typeParam Ins - The input type.
 * @typeParam OutcomeType - The accumulated outcome type.
 */
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
/**
 * The `array` parser, aliased from `arrayOf` with the `isArray` guard attached.
 */
const array: typeof arrayOf & Parser<unknown, unknown[]> = Object.assign(
  function arrayOfWrapper(...args: any) {
    return (arrayOf as any)(...args);
  },
  isArray,
) as any;

/**
 * The main entry point for ts-matches pattern matching.
 *
 * Provides a chainable API for pattern matching expressions that works with TypeScript's
 * type system to narrow types through `.when()` clauses.
 *
 * @example
 * ```ts
 * // As a pattern matcher
 * const getText = (x: unknown): string =>
 *   matches(x)
 *     .when(matches.string, (value) => `Found string: ${value}`)
 *     .when(matches.number, (value) => `Found number + 1: ${value + 1}`)
 *     .defaultTo("no found type yet");
 *
 * // As a schema validator
 * const goldFishMatcher = matches.object({
 *   type: t.literal("gold-fish"),
 *   position: t.tuple(t.number, t.number),
 *   age: t.natural,
 *   name: t.string,
 * });
 * ```
 *
 * Also exposes all parser factory functions as properties.
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
