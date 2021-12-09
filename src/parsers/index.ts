import { _, ValidatorError } from "./interfaces.ts";
import { isNumber } from "./utils.ts";
import { GuardParser } from "./guard-parser.ts";
import { Parser } from "./parser.ts";
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
} from "./simple-parsers.ts";
import { some } from "./some-parser.ts";
import { every } from "./every-parser.ts";
import { dictionary } from "./dictionary-parser.ts";
import { partial, shape } from "./shape-parser.ts";
import { tuple } from "./tuple-parser.ts";
import { arrayOf } from "./array-of-parser.ts";
import { literal, literals } from "./literal-parser.ts";
export type { ValidatorError };
export {
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
