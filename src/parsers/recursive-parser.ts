import { Description, IParser, OnParse, ParserInto } from "./interfaces";
import { Parser } from "./parser";
import { any } from "./simple-parsers";

const NAME = "Recursive";
type LazyParser<A> = (parser: Parser<unknown, any>) => Parser<unknown, A>;
/**
 * This parser is used when trying to create parsers that
 * user their own definitions in their types, like interface Tree<Leaf> {
 *   [key: string]: Tree<Leaf> | Leaf;
 * }
 */
export class RecursiveParser<B> implements IParser<unknown, B> {
  private parser?: Parser<unknown, B>;
  static create<B>(fn: LazyParser<B>): RecursiveParser<B> {
    const parser = RecursiveParser.of<any>(fn);
    parser.parser = fn(new Parser(parser));
    return parser;
  }
  private static of<B>(recursive: LazyParser<B>) {
    return new RecursiveParser({
      name: NAME,
      children: [],
      extras: [recursive],
    });
  }
  private constructor(
    readonly description: {
      name: typeof NAME;
      children: [];
      extras: [LazyParser<B>];
    },
  ) {}
  fromDescription(description: Description): IParser<unknown, B> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new RecursiveParser(description as typeof this.description);
  }
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
