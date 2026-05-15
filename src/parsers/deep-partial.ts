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
export type DeepPartial<T> = T extends Array<infer U> ? Array<DeepPartial<U>>
  : T extends readonly (infer U)[] ? readonly DeepPartial<U>[]
  : T extends [infer A, ...infer Rest] ? [DeepPartial<A>, ...DeepPartial<Rest>]
  : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Transforms a parser tree so all nested ShapeParsers have isPartial: true.
 */
export function deepPartial<A, B>(parser: Parser<A, B>): Parser<A, DeepPartial<B>> {
  return new Parser(
    transformParser(parser.parser, new WeakSet()),
  ) as any;
}

function unwrapParser(p: IParser<unknown, unknown>): IParser<unknown, unknown> {
  if (Parser.isParser(p)) return unwrapParser(p.parser);
  return p;
}

function transformParser<A, B>(
  iparser: IParser<A, B>,
  visited: WeakSet<IParser<unknown, unknown>>,
): IParser<A, DeepPartial<B>> {
  // Unwrap Parser wrappers to reach the inner IParser
  const unwrapped = unwrapParser(iparser) as IParser<A, B>;

  // Handle ShapeParser — clone with isPartial: true
  if (unwrapped instanceof ShapeParser) {
    if (visited.has(unwrapped)) {
      return unwrapped as any;
    }
    visited.add(unwrapped);

    const newParserMap: any = {};
    for (const key of unwrapped.parserKeys) {
      newParserMap[key] = new Parser(
        transformParser(unwrapped.parserMap[key], visited),
      );
    }
    return new ShapeParser(newParserMap, true);
  }

  // Handle ArrayOfParser — recurse into item parser
  if (unwrapped instanceof ArrayOfParser) {
    const transformed = transformParser(unwrapped.parser.parser, visited);
    return new ArrayOfParser(new Parser(transformed)) as any;
  }

  // Handle TupleParser — recurse into each element parser
  if (unwrapped instanceof TupleParser) {
    const transformedParsers = unwrapped.parsers.map((p: Parser<unknown, unknown>) =>
      new Parser(transformParser(p.parser, visited)),
    );
    return new TupleParser(transformedParsers) as any;
  }

  // Handle RecursiveParser — recurse into inner parser
  if (unwrapped instanceof RecursiveParser) {
    const inner = (unwrapped as any).parser;
    if (inner) {
      return transformParser(inner.parser, visited);
    }
    return unwrapped as any;
  }

  // Default: pass through unchanged
  return iparser as any;
}
