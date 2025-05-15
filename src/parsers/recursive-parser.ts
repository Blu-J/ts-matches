import { IParser, OnParse, ParserInto } from "./interfaces";
import { Parser } from "./parser";
import { any } from "./simple-parsers";

/**
 * This parser is used when trying to create parsers that
 * user their own definitions in their types, like interface Tree<Leaf> {
 *   [key: string]: Tree<Leaf> | Leaf;
 * }
 */
export class RecursiveParser<B> implements IParser<unknown, B> {
  private parser?: Parser<unknown, B>;
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
 * Must pass the shape that we expect since typescript as of this point
 * can't infer with recursive functions like this.
 * @param fn This should be a function that takes a parser, basically the self in a type recursion, and
 * return a parser that is the combination of the recursion.
 * @returns
 */
export function recursive<B = never>(fn: EnsurredType<B>) {
  const value = fn(any);
  const created: RecursiveParser<ParserInto<typeof value>> =
    RecursiveParser.create<B>(fn);
  return new Parser(created);
}
