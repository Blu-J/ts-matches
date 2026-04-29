import { IParser, OnParse, ParserInto } from "./interfaces";
import { Parser } from "./parser";
import { any } from "./simple-parsers";

/**
 * A parser for recursive and mutually recursive type definitions.
 * Enables self-referential types like trees, linked lists, and nested structures.
 *
 * @example
 * ```ts
 * type Tree = { type: 'leaf', value: number } | { type: 'branch', children: Tree[] }
 * const treeParser = recursive<Tree>((self) =>
 *   some(
 *     shape({ type: literal('leaf'), value: number }),
 *     shape({ type: literal('branch'), children: arrayOf(self) }),
 *   ),
 * );
 * ```
 *
 * @typeParam B - The output type of the recursive parser.
 */
export class RecursiveParser<B> implements IParser<unknown, B> {
  private parser?: Parser<unknown, B>;
  /**
   * Creates a new RecursiveParser with the given factory function.
   * @typeParam B - The output type.
   * @param fn - A function that receives a parser (the recursive reference) and returns a parser.
   * @returns A new RecursiveParser.
   */
  static create<B>(
    fn: (parser: Parser<unknown, any>) => Parser<unknown, unknown>,
  ): RecursiveParser<B> {
    const parser = new RecursiveParser<any>(fn);
    parser.parser = fn(new Parser(parser));
    return parser;
  }
  private constructor(
    readonly recursive: (
      parser: Parser<unknown, any>,
    ) => Parser<unknown, unknown>,
    readonly description = {
      name: "Recursive",
      children: [],
      extras: [recursive],
    } as const,
  ) {}
  /**
   * Parses the input using the recursive parser.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error if in invalid state.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, B, C, D>): C | D {
    if (!this.parser) {
      return onParse.invalid({
        value: "Recursive Invalid State",
        keys: [],
        parser: this,
      });
    }
    return this.parser.parse(a, onParse);
  }
}

type EnsurredType<A, B = A> = (A extends never ? never : unknown) &
  ((parser: Parser<unknown, B>) => Parser<unknown, B>);

/**
 * Creates a recursive parser for self-referential types.
 * Must explicitly provide the expected type since TypeScript cannot infer it.
 *
 * @example
 * ```ts
 * type Tree = { type: 'leaf', value: number } | { type: 'branch', children: Tree[] }
 * const treeParser = recursive<Tree>((self) =>
 *   some(
 *     shape({ type: literal('leaf'), value: number }),
 *     shape({ type: literal('branch'), children: arrayOf(self) }),
 *   ),
 * );
 * ```
 *
 * @typeParam B - The expected output type (must be provided explicitly).
 * @param fn - A function that receives a parser (the recursive reference) and returns a parser.
 * @returns A Parser for the recursive type.
 */
export function recursive<B = never>(fn: EnsurredType<B>) {
  const value = fn(any);
  const created: RecursiveParser<ParserInto<typeof value>> =
    RecursiveParser.create<B>(fn);
  return new Parser(created);
}
