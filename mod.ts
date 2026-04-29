/**
 * Re-exports all modules from the ts-matches library.
 * This is the main entry point for importing the library.
 */
export * from "./src/matches";

import matches from "./src/matches";

/**
 * Parser for validating any value.
 */
export { AnyParser } from "./src/parsers/any-parser";

/**
 * Parser for validating arrays.
 */
export { ArrayParser } from "./src/parsers/array-parser";

/**
 * Parser for validating booleans.
 */
export { BoolParser } from "./src/parsers/bool-parser";

/**
 * Parser for validating functions.
 */
export { FunctionParser } from "./src/parsers/function-parser";

/**
 * Parser for validating with custom type guards.
 */
export { GuardParser } from "./src/parsers/guard-parser";

/**
 * Parser for validating null or undefined.
 */
export { NilParser } from "./src/parsers/nill-parser";

/**
 * Parser for validating numbers.
 */
export { NumberParser } from "./src/parsers/number-parser";

/**
 * Parser for validating objects.
 */
export { ObjectParser } from "./src/parsers/object-parser";

/**
 * Parser for union (OR) matching of two parsers.
 */
export { OrParsers } from "./src/parsers/or-parser";

/**
 * Parser for validating object shapes.
 */
export { ShapeParser } from "./src/parsers/shape-parser";

/**
 * Parser for validating strings.
 */
export { StringParser } from "./src/parsers/string-parser";

/**
 * Safely stringifies values, falling back to toString() for circular references.
 */
export { saferStringify } from "./src/utils";

/**
 * Parser that wraps another parser with a custom name for error messages.
 */
export { NamedParser } from "./src/parsers/named";

/**
 * Parser for validating arrays of a specific type.
 */
export { ArrayOfParser } from "./src/parsers/array-of-parser";

/**
 * Parser for validating literal values.
 */
export { LiteralsParser } from "./src/parsers/literal-parser";

/**
 * Parser that concatenates two parsers sequentially.
 */
export { ConcatParsers } from "./src/parsers/concat-parser";

/**
 * Parser that maps the output of a parent parser.
 */
export { MappedAParser } from "./src/parsers/mapped-parser";

export default matches;
