import { IsAParser } from ".";
import { saferStringify } from "../utils";
import { ConcatParsers } from "./ConcatParser";
import { DefaultParser } from "./DefaultParser";
import { DictionaryParser } from "./DictionaryParser";
import { GuardParser } from "./GuardParser";
import {
  IParser,
  OnParse,
  ISimpleParsedError,
  Optional,
  NonNull,
} from "./interfaces";
import { MappedAParser } from "./MappedAParser";
import { MaybeParser } from "./MaybeParser";
import { OrParsers } from "./OrParser";
import { ShapeParser } from "./ShapeParser";
import { identity, booleanOnParse } from "./utils";

export class Parser<A, B> implements IParser<A, B> {
  public readonly _TYPE: B = null as any;
  constructor(
    readonly parser: IParser<A, B>,
    readonly description = {
      name: "Wrapper",
      children: [parser],
      extras: [],
    } as const
  ) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    return this.parser.parse(a, onParse);
  }
  public static isA<A, B extends A>(
    checkIsA: (value: A) => value is B,
    name: string
  ): Parser<A, B> {
    return new Parser(new IsAParser(checkIsA, name));
  }

  /**
   * This is the line of code that could be over written if
   * One would like to have a custom error as any shape
   */

  public static validatorErrorAsString = <A, B>(
    error: ISimpleParsedError
  ): string => {
    const { parser, value, keys } = error;

    const keysString = !keys.length
      ? ""
      : keys
          .map((x) => `[${x}]`)
          .reverse()
          .join("");

    return `${keysString}${Parser.parserAsString(parser)}(${saferStringify(
      value
    )})`;
  };

  public static parserAsString(parser: IParser<unknown, unknown>): string {
    if (parser instanceof Parser) {
      return Parser.parserAsString(parser.parser);
    }
    const {
      description: { name, extras, children },
    } = parser;
    if (parser instanceof DictionaryParser) {
      return `${name}<{${parser.parsers
        .map(
          ([key, value]: [
            IParser<unknown, unknown>,
            IParser<unknown, unknown>
          ]) => `${Parser.parserAsString(key)}:${Parser.parserAsString(value)}`
        )
        .join(",")}}>`;
    }
    if (parser instanceof ShapeParser) {
      return `${name}<{${parser.description.children
        .map(
          (subParser, i) =>
            `${
              String(parser.description.extras[i]) || "?"
            }:${Parser.parserAsString(subParser)}`
        )
        .join(",")}}>`;
    }
    if (parser instanceof OrParsers) {
      const parentString = Parser.parserAsString(parser.parent);
      if (parser.parent instanceof OrParsers) return parentString;
      if (
        parser.parent instanceof Parser &&
        parser.parent.parser instanceof OrParsers
      )
        return parentString;

      return `${name}<${parentString},...>`;
    }
    if (parser instanceof GuardParser) {
      return String(extras[0] || name);
    }
    const specifiers = [
      ...extras.map(saferStringify),
      ...children.map(Parser.parserAsString),
    ];
    const specifiersString = !specifiers.length
      ? ""
      : `<${specifiers.join(",")}>`;
    const childrenString = !children.length ? "" : `<>`;

    return `${name}${specifiersString}`;
  }
  unsafeCast(value: A): B {
    return this.parse(value, {
      parsed: identity,
      invalid(error) {
        throw new TypeError(
          `Failed type: ${Parser.validatorErrorAsString(
            error
          )} given input ${saferStringify(value)}`
        );
      },
    });
  }
  castPromise(value: A): Promise<B> {
    return new Promise((resolve, reject) =>
      this.parse(value, {
        parsed: resolve,
        invalid(error) {
          reject(
            new TypeError(
              `Failed type: ${Parser.validatorErrorAsString(
                error
              )} given input ${saferStringify(value)}`
            )
          );
        },
      })
    );
  }

  map<C>(fn: (apply: B) => C, mappingName?: string): Parser<A, C> {
    return new Parser(new MappedAParser(this, fn, mappingName));
  }

  concat<C>(otherParser: IParser<B, C>): Parser<A, C> {
    return new Parser(ConcatParsers.of(this, otherParser) as any);
  }

  orParser<C>(otherParser: IParser<A, C>): Parser<A, B | C> {
    return new Parser(new OrParsers(this, otherParser));
  }

  test = (value: A): value is A & B => {
    return this.parse(value, booleanOnParse);
  };

  /**
   * When we want to make sure that we handle the null later on in a monoid fashion,
   * and this ensures we deal with the value
   */
  optional(name?: string): Parser<Optional<A>, Optional<B>> {
    return new Parser(new MaybeParser(this));
  }
  /**
   * There are times that we would like to bring in a value that we know as null or undefined
   * and want it to go to a default value
   */
  defaultTo<C>(defaultValue: C): Parser<Optional<A>, C | NonNull<B, C>> {
    return new Parser(new DefaultParser(new MaybeParser(this), defaultValue));
  }
  /**
   * We want to test value with a test eg isEven
   */
  validate(isValid: (value: B) => boolean, otherName: string): Parser<A, B> {
    return new Parser(
      ConcatParsers.of(
        this,
        new IsAParser(isValid as (value: B) => value is B, otherName)
      ) as any
    );
  }
  /**
   * We want to refine to a new type given an original type, like isEven, or casting to a more
   * specific type
   */
  refine<C = B>(
    refinementTest: (value: B) => value is B & C,
    otherName: string = refinementTest.name
  ): Parser<A, B & C> {
    return new Parser(
      ConcatParsers.of(this, new IsAParser(refinementTest, otherName)) as any
    );
  }
}
