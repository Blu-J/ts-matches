import {
  OnParse,
  IParser,
  Optional,
  NonNull,
  ISimpleParsedError,
  EnsureParser,
  OrParser,
  AndParser,
  _,
  ParserInto,
  ValidatorError,
} from "./interfaces";
import { saferStringify } from "../utils";
import {
  identity,
  booleanOnParse,
  isNumber,
  isFunctionTest,
  isObject,
  isString,
} from "./utils";
import { IsAParser } from "./IsAParser";
import { MappedAParser } from "./MappedAParser";
import { ConcatParsers } from "./ConcatParser";
import { OrParsers } from "./OrParser";
import { MaybeParser } from "./MaybeParser";
import { DefaultParser } from "./DefaultParser";
import { Parser } from "./Parser";
import {
  literal,
  guard,
  any,
  literals,
  string,
  isFunction,
  boolean,
  object,
  isArray,
  instanceOf,
  number,
  regex,
  isNill,
  natural,
} from "./SimpleParsers";
import { some } from "./SomeParser";
import { every } from "./EveryParser";
import { dictionary } from "./DictionaryParser";
import { isPartial, isShape, partial, shape } from "./ShapeParser";
import { tuple } from "./TupleParser";
import { arrayOf } from "./ArrayOfParser";

export {
  ValidatorError,
  IsAParser,
  Parser,
  literal,
  guard,
  any,
  literals,
  instanceOf,
  isArray,
  isNumber,
  string,
  isFunction,
  boolean,
  number,
  object,
  regex,
  arrayOf,
  natural,
  isNill,
  every,
  some,
  dictionary,
  partial,
  tuple,
  shape,
};
