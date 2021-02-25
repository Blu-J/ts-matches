import { IsAParser } from ".";
import { saferStringify } from "../utils";
import { ConcatParsers } from "./ConcatParser";
import { DefaultParser } from "./DefaultParser";
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
import { identity, booleanOnParse } from "./utils";

export class Parser<A, B> implements IParser<A, B> {
  readonly name = this.parser.name;
  public readonly _TYPE: B = null as any;
  constructor(readonly parser: IParser<A, B>) {}
  parse<C, D>(a: A, onParse: OnParse<A, B, C, D>): C | D {
    return this.parser.parse(a, onParse);
  }
  public static isA<A, B extends A>(
    checkIsA: (value: A) => value is B,
    name?: string
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
    const { name, value } = error;

    return `${name}(${saferStringify(value)})`;
  };
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
    return new Parser(new MaybeParser(this, name));
  }
  /**
   * There are times that we would like to bring in a value that we know as null or undefined
   * and want it to go to a default value
   */
  defaultTo<C>(
    defaultValue: C,
    name?: string
  ): Parser<Optional<A>, C | NonNull<B, C>> {
    return new Parser(
      new DefaultParser(new MaybeParser(this, this.name), defaultValue, name)
    );
  }
  /**
   * We want to refine to a new type given an original type, like isEven, or casting to a more
   * specific type
   */
  refine<C = B>(
    refinementTest: (value: B) => value is B & C,
    otherName?: string
  ): Parser<A, B & C> {
    return new Parser(
      ConcatParsers.of(this, new IsAParser(refinementTest, otherName)) as any
    );
  }
}
