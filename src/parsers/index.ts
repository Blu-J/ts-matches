import { _, ValidatorError } from "./interfaces";
import { isNumber } from "./utils";
import { IsAParser } from "./IsAParser";
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
import { partial, shape } from "./ShapeParser";
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
