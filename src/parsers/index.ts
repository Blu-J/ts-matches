import { _, ValidatorError } from "./interfaces";
import { isNumber } from "./utils";
import { GuardParser } from "./guard-parser";
import { Parser } from "./parser";
import {
  any,
  boolean,
  guard,
  instanceOf,
  isArray,
  isFunction,
  isNill,
  natural,
  number,
  object,
  regex,
  string,
} from "./simple-parsers";
import { some } from "./some-parser";
import { every } from "./every-parser";
import { dictionary } from "./dictionary-parser";
import { partial, shape } from "./shape-parser";
import { tuple } from "./tuple-parser";
import { arrayOf } from "./array-of-parser";
import { literal, literals } from "./literal-parser";
import { recursive } from "./recursive-parser";
import { deferred } from "./deferred-parser";
export type { ValidatorError };
export {
  any,
  arrayOf,
  boolean,
  deferred,
  dictionary,
  every,
  guard,
  GuardParser as IsAParser,
  instanceOf,
  isArray,
  isFunction,
  isNill,
  isNumber,
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
};
