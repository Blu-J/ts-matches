import { IsAParser } from "./index.ts";
import { saferStringify } from "../utils.ts";
import { AnyParser } from "./any-parser.ts";
import { ArrayParser } from "./array-parser.ts";
import { BoolParser } from "./bool-parser.ts";
import { ConcatParsers } from "./concat-parser.ts";
import { DefaultParser } from "./default-parser.ts";
import { FunctionParser } from "./function-parser.ts";
import { GuardParser } from "./guard-parser.ts";
import {
  IParser,
  ISimpleParsedError,
  NonNull,
  OnParse,
  Optional,
} from "./interfaces.ts";
import { MappedAParser } from "./mapped-parser.ts";
import { MaybeParser } from "./maybe-parser.ts";
import { parserName } from "./named.ts";
import { NilParser } from "./nill-parser.ts";
import { NumberParser } from "./number-parser.ts";
import { ObjectParser } from "./object-parser.ts";
import { OrParsers } from "./or-parser.ts";
import { ShapeParser } from "./shape-parser.ts";
import { StringParser } from "./string-parser.ts";
import { booleanOnParse } from "./utils.ts";
function unwrapParser(a: IParser<unknown, unknown>): IParser<unknown, unknown> {
  if (a instanceof Parser) return unwrapParser(a.parser);
  return a;
}

const enumParsed = {
  parsed<A>(value: A) {
    return { value };
  },
  invalid(error: ISimpleParsedError) {
    return { error };
  },
};

/**
 * A Parser is usually a function that takes a value and returns a Parsed value.
 * For this class we have that as our main reason but we want to be able to have other methods
 * including testing and showing text representations.
 *
 * The main function unsafeCast which will take in a value A (usually unknown) and will always return a B. If it cannot
 * it will throw an error.
 *
 * The parse function is the lower level function that will take in a value and a dictionary of what to do with success and failure.
 */
export class Parser<A, B> implements IParser<A, B> {
  /// This is a hack to get the type of what the parser is going to return.
  public readonly _TYPE: B = null as any;
  constructor(
    readonly parser: IParser<A, B>,
    readonly description = {
      name: "Wrapper",
      children: [parser],
      extras: [],
    } as const,
  ) {}
  /**
   * Use this when you want to decide what happens on the succes and failure cases of parsing
   * @param a
   * @param onParse
   * @returns
   */
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    return this.parser.parse(a, onParse);
  }
  /**
   * This is a constructor helper that can use a predicate tester in the form of a guard function,
   * and will return a parser that will only parse if the predicate returns true.
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
   * @param checkIsA
   * @param name
   * @returns
   */
  public static isA<A, B extends A>(
    checkIsA: (value: A) => value is B,
    name: string,
  ): Parser<A, B> {
    return new Parser(new IsAParser(checkIsA, name));
  }

  /**
   * This is the line of code that could be over written if
   * One would like to have a custom error as any shape
   */

  public static validatorErrorAsString = <A, B>(
    error: ISimpleParsedError,
  ): string => {
    const { parser, value, keys } = error;

    const keysString = !keys.length ? "" : keys
      .map((x) => `[${x}]`)
      .reverse()
      .join("");

    return `${keysString}${Parser.parserAsString(parser)}(${
      saferStringify(
        value,
      )
    })`;
  };

  /**
   * Trying to convert the parser into a string representation
   * @param parserComingIn
   * @returns
   */
  public static parserAsString(
    parserComingIn: IParser<unknown, unknown>,
  ): string {
    const parser = unwrapParser(parserComingIn);
    const {
      description: { name, extras, children },
    } = parser;
    if (parser instanceof ShapeParser) {
      return `${name}<{${
        parser.description.children
          .map(
            (subParser, i) =>
              `${String(parser.description.extras[i]) || "?"}:${
                Parser.parserAsString(subParser)
              }`,
          )
          .join(",")
      }}>`;
    }
    if (parser instanceof OrParsers) {
      const parent = unwrapParser(parser.parent);
      const parentString = Parser.parserAsString(parent);
      if (parent instanceof OrParsers) return parentString;

      return `${name}<${parentString},...>`;
    }
    if (parser instanceof GuardParser) {
      return String(extras[0] || name);
    }
    if (
      parser instanceof StringParser ||
      parser instanceof ObjectParser ||
      parser instanceof NumberParser ||
      parser instanceof BoolParser ||
      parser instanceof AnyParser
    ) {
      return name.toLowerCase();
    }
    if (parser instanceof FunctionParser) {
      return name;
    }
    if (parser instanceof NilParser) {
      return "null";
    }
    if (parser instanceof ArrayParser) {
      return "Array<unknown>";
    }
    const specifiers = [
      ...extras.map(saferStringify),
      ...children.map(Parser.parserAsString),
    ];
    const specifiersString = `<${specifiers.join(",")}>`;
    const childrenString = !children.length ? "" : `<>`;

    return `${name}${specifiersString}`;
  }

  /**
   * This is the most useful parser, it assumes the happy path and will throw an error if it fails.
   * @param value
   * @returns
   */
  unsafeCast(value: A): B {
    const state = this.enumParsed(value);
    if ("value" in state) return state.value;
    const { error } = state;
    throw new TypeError(
      `Failed type: ${
        Parser.validatorErrorAsString(
          error,
        )
      } given input ${saferStringify(value)}`,
    );
  }
  /**
   * This is the like the unsafe parser, it assumes the happy path and will throw and return a failed promise during failure.
   * @param value
   * @returns
   */
  castPromise(value: A): Promise<B> {
    const state = this.enumParsed(value);
    if ("value" in state) return Promise.resolve(state.value);
    const { error } = state;
    return Promise.reject(
      new TypeError(
        `Failed type: ${
          Parser.validatorErrorAsString(
            error,
          )
        } given input ${saferStringify(value)}`,
      ),
    );
  }

  /**
   * When we want to get the error message from the input, to know what is wrong
   * @param input
   * @returns Null if there is no error
   */
  errorMessage(input: A): void | string {
    const parsed = this.parse(input, enumParsed);
    if ("value" in parsed) return;
    return Parser.validatorErrorAsString(
      parsed.error,
    );
  }

  /**
   * Use this that we want to do transformations after the value is valid and parsed.
   * A use case would be parsing a string, making sure it can be parsed to a number, and then convert to a number
   * @param fn
   * @param mappingName
   * @returns
   */
  map<C>(fn: (apply: B) => C, mappingName?: string): Parser<A, C> {
    return new Parser(new MappedAParser(this, fn, mappingName));
  }

  /**
   * Use this when you want to combine two parsers into one. This will make sure that both parsers will run against the same value.
   * @param otherParser
   * @returns
   */
  concat<C>(otherParser: IParser<B, C>): Parser<A, C> {
    return new Parser(ConcatParsers.of(this, new Parser(otherParser)) as any);
  }

  /**
   * Use this to combine parsers into one. This will make sure that one or the other parsers will run against the value.
   * @param otherParser
   * @returns
   */
  orParser<C>(otherParser: IParser<A, C>): Parser<A, B | C> {
    return new Parser(new OrParsers(this, new Parser(otherParser)));
  }

  /**
   * Use this as a guard clause, useful for escaping during the error cases.
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
   * @param value
   * @returns
   */
  test = (value: A): value is A & B => {
    return this.parse(value, booleanOnParse);
  };

  /**
   * When we want to make sure that we handle the null later on in a monoid fashion,
   * and this ensures we deal with the value
   * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining
   */
  optional(name?: string): Parser<Optional<A>, Optional<B>> {
    return new Parser(new MaybeParser(this));
  }
  /**
   * There are times that we would like to bring in a value that we know as null or undefined
   * and want it to go to a default value
   */
  defaultTo<C>(defaultValue: C): Parser<Optional<A>, C | NonNull<B, C>> {
    return new Parser(
      new DefaultParser(new Parser(new MaybeParser(this)), defaultValue),
    );
  }
  /**
   * We want to test value with a test eg isEven
   */
  validate(isValid: (value: B) => boolean, otherName: string): Parser<A, B> {
    return new Parser(
      ConcatParsers.of(
        this,
        new Parser(
          new IsAParser(isValid as (value: B) => value is B, otherName),
        ),
      ) as any,
    );
  }
  /**
   * We want to refine to a new type given an original type, like isEven, or casting to a more
   * specific type
   */
  refine<C = B>(
    refinementTest: (value: B) => value is B & C,
    otherName: string = refinementTest.name,
  ): Parser<A, B & C> {
    return new Parser(
      ConcatParsers.of(
        this,
        new Parser(new IsAParser(refinementTest, otherName)),
      ) as any,
    );
  }

  /**
   * Use this when we want to give the parser a name, and we want to be able to use the name in the error messages.
   * @param nameString
   * @returns
   */
  name(nameString: string): Parser<A, B> {
    return parserName(nameString, this);
  }

  /**
   * This is another type of parsing that will return a value that is a discriminated union of the success and failure cases.
   * https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions
   * @param value
   * @returns
   */
  enumParsed(value: A): { value: B } | { error: ISimpleParsedError } {
    return this.parse(value, enumParsed) as any;
  }

  /**
   * Return the unwrapped parser/ IParser
   * @returns
   */
  unwrappedParser() {
    let answer: Parser<any, any> = this;
    while (true) {
      const next = answer.parser;
      if (next instanceof Parser) {
        answer = next;
      } else {
        return next;
      }
    }
  }
}
