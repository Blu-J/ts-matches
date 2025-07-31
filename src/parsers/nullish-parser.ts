import { IParser, Optional, NonNull, OnParse, Description } from "./interfaces";
import { Parser } from "./parser";

/**
 * The name used to identify this parser type in descriptions.
 */
const NAME = "Nullable";

/**
 * A parser that wraps another parser and allows null values to be parsed,
 * returning a default value when null is encountered.
 *
 * This parser extends the functionality of a base parser by accepting null
 * as a valid input and converting it to a specified default value.
 *
 * @example
 * ```typescript
 * // Create a parser that accepts numbers or null, returning 0 for null values
 * const numberParser = Parser.of(Number);
 * const nullableNumberParser = NullishParsed.of(numberParser, 0);
 *
 * // Usage:
 * nullableNumberParser.parse(42);    // Returns 42
 * nullableNumberParser.parse(null);  // Returns 0 (default value)
 * ```
 */
export class NullishParsed<SourceType, ParsedType, DefaultValueType>
  implements IParser<SourceType | null, NonNull<ParsedType, DefaultValueType>>
{
  /**
   * Creates a new NullishParsed instance that wraps another parser.
   *
   * @param wrappedParser - The base parser to wrap
   * @param defaultValue - The default value to return when null is encountered
   * @returns A new NullishParsed instance
   *
   * @example
   * ```typescript
   * const stringParser = Parser.of(String);
   * const nullableStringParser = NullishParsed.of(stringParser, "default");
   * ```
   */
  static of<SourceType, ParsedType, DefaultValueType>(
    wrappedParser: Parser<SourceType, ParsedType>,
    defaultValue: DefaultValueType,
  ) {
    return new NullishParsed({
      name: NAME,
      children: [wrappedParser],
      extras: [defaultValue],
    });
  }

  /**
   * Creates a new NullishParsed instance.
   *
   * @param description - The description object containing parser configuration
   */
  constructor(
    readonly description: {
      name: typeof NAME;
      children: [Parser<SourceType, ParsedType>];
      extras: [DefaultValueType];
    },
  ) {}

  /**
   * Gets the default value that will be returned when null is encountered.
   *
   * @returns The default value for null inputs
   */
  get defaultValue(): DefaultValueType {
    return this.description.extras[0];
  }

  /**
   * Gets the parent parser that this nullish parser wraps.
   *
   * @returns The wrapped parser instance
   */
  get parent(): Parser<SourceType, ParsedType> {
    return this.description.children[0];
  }

  /**
   * Creates a new parser instance from a description object.
   *
   * @param description - The description to create the parser from
   * @returns A new NullishParsed instance
   * @throws Error if the description is invalid or doesn't match this parser type
   *
   * @example
   * ```typescript
   * const parser = NullishParsed.of(Parser.of(String), "default");
   * const newParser = parser.fromDescription(parser.description);
   * ```
   */
  fromDescription(
    description: Description,
  ): IParser<SourceType | null, NonNull<ParsedType, DefaultValueType>> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new NullishParsed(description as typeof this.description);
  }

  /**
   * Parses a value using the wrapped parser, handling null inputs by returning
   * the default value.
   *
   * @param value - The value to parse (can be null)
   * @param onParse - Callback functions for handling parsed and invalid results
   * @returns The parsed result or an error
   *
   * @example
   * ```typescript
   * const parser = NullishParsed.of(Parser.of(Number), 0);
   *
   * // Successful parsing of a number
   * parser.parse(42, {
   *   parsed: (result) => console.log(result), // Logs: 42
   *   invalid: (error) => console.log(error)
   * });
   *
   * // Parsing null returns default value
   * parser.parse(null, {
   *   parsed: (result) => console.log(result), // Logs: 0
   *   invalid: (error) => console.log(error)
   * });
   * ```
   */
  parse<C, D>(
    value: SourceType,
    onParse: OnParse<
      SourceType | null,
      NonNull<ParsedType, DefaultValueType>,
      C,
      D
    >,
  ): C | D {
    const defaultValue = this.defaultValue;
    if (value === null) {
      return onParse.parsed(defaultValue as any);
    }
    const parentCheck = this.parent.enumParsed(value);
    if ("error" in parentCheck) {
      parentCheck.error.parser = this;
      return onParse.invalid(parentCheck.error);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
