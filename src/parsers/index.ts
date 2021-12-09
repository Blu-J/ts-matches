import { _, ValidatorError } from "./interfaces";
import { isNumber } from "./utils";
import { GuardParser } from "./guardParser";
import { Parser } from "./parser";
import {
  guard,
  any,
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
} from "./simpleParsers";
import { some } from "./someParser";
import { every } from "./everyParser";
import { dictionary } from "./dictionaryParser";
import { partial, shape } from "./shapeParser";
import { tuple } from "./tupleParser";
import { arrayOf } from "./arrayOfParser";
import { literal, literals } from "./literalParser";

export {
  ValidatorError,
  GuardParser as IsAParser,
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
