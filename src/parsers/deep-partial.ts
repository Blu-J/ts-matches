import { Parser } from "./parser";
import { ShapeParser } from "./shape-parser";
import { ArrayOfParser } from "./array-of-parser";
import { TupleParser } from "./tuple-parser";
import { RecursiveParser } from "./recursive-parser";
import { IParser } from "./interfaces";

/**
 * Recursively makes all properties of an object type optional,
 * including nested objects, arrays, and tuples.
 */
export type DeepPartial<T> =
  T extends Array<infer U> ? Array<DeepPartial<U>>
  : T extends readonly (infer U)[] ? readonly DeepPartial<U>[]
  : T extends [infer A, ...infer Rest] ? [DeepPartial<A>, ...DeepPartial<Rest>]
  : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Transforms a parser tree so all nested ShapeParsers have isPartial: true.
 */
export function deepPartial<A, B>(
  parser: Parser<A, B>,
): Parser<A, DeepPartial<B>> {
  return new Parser<A, DeepPartial<B>>(
    transformParser(parser.parser, new WeakSet()),
  );
}

function unwrapParser<A, B>(p: IParser<A, B>): IParser<A, B> {
  if (Parser.isParser(p)) return unwrapParser(p.parser);
  return p;
}

function tryTransformShapeParser(
  parser: ShapeParser<unknown, string | number | symbol, unknown>,
  visited: WeakSet<IParser<unknown, unknown>>,
): IParser<unknown, unknown> {
  if (visited.has(parser)) return parser;
  visited.add(parser);

  const newParserMap: Record<string, Parser<unknown, unknown>> = {};
  for (const key of parser.parserKeys) {
    newParserMap[key] = new Parser(
      transformParser(parser.parserMap[key], visited),
    );
  }

  return new ShapeParser(newParserMap, true);
}

function tryTransformArrayOfParser<A, B>(
  parser: ArrayOfParser<B>,
  visited: WeakSet<IParser<A, B>>,
): IParser<A, DeepPartial<B>> {
  const transformed = transformParser(parser.parser.parser, visited);
  return new ArrayOfParser(new Parser(transformed)) as IParser<
    A,
    DeepPartial<B>
  >;
}

function tryTransformTupleParser<A, B>(
  parser: TupleParser<Parser<unknown, unknown>[]>,
  visited: WeakSet<IParser<A, B>>,
): IParser<A, DeepPartial<B>> {
  const transformedParsers = parser.parsers.map(
    (p) => new Parser(transformParser(p.parser, visited)),
  );
  return new TupleParser(transformedParsers);
}

function tryTransformRecursiveParser<A, B>(
  parser: RecursiveParser<A, B>,
  visited: WeakSet<IParser<A, B>>,
): IParser<A, DeepPartial<B>> {
  if (!("parser" in parser)) return parser;
  const inner = parser.parser;
  return transformParser(inner.parser, visited);
}

function transformParser<A, B>(
  iParser: IParser<A, B>,
  visited: WeakSet<IParser<A, B>>,
): IParser<A, DeepPartial<B>> {
  const unwrapped = unwrapParser(iParser);

  if (unwrapped instanceof ShapeParser)
    return tryTransformShapeParser(unwrapped, visited);

  if (unwrapped instanceof ArrayOfParser)
    return tryTransformArrayOfParser(unwrapped, visited);

  if (unwrapped instanceof TupleParser)
    return tryTransformTupleParser(unwrapped, visited);

  if (unwrapped instanceof RecursiveParser)
    return tryTransformRecursiveParser(unwrapped, visited);

  return iParser as IParser<A, DeepPartial<B>>;
}
