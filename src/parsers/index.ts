import { _, ValidatorError } from "./interfaces.ts";
import { isNumber } from "./utils.ts";
import { GuardParser } from "./guard-parser.ts";
import { Parser } from "./parser.ts";
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
} from "./simple-parsers.ts";
import { some } from "./some-parser.ts";
import { every } from "./every-parser.ts";
import { dictionary } from "./dictionary-parser.ts";
import { partial, shape } from "./shape-parser.ts";
import { tuple } from "./tuple-parser.ts";
import { arrayOf } from "./array-of-parser.ts";
import { literal, literals } from "./literal-parser.ts";
import { recursive } from "./recursive-parser.ts";
import { deferred } from "./deferred-parser.ts";
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
