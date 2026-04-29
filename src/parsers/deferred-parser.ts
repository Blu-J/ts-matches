import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

/**
 * A parser whose implementation is set later, enabling recursive and mutually
 * recursive type definitions in TypeScript.
 *
 * Use case: defining recursive types like
 * ```ts
 * type Tree = { type: 'leaf', value: number } | { type: 'branch', children: Tree[] }
 * ```
 *
 * @typeParam B - The output type of the deferred parser.
 */
export class DeferredParser<B> implements IParser<unknown, B> {
  private parser?: Parser<unknown, B>;
  /**
   * Creates a new DeferredParser instance.
   * @returns A new DeferredParser.
   */
  static create<B>(): DeferredParser<B> {
    return new DeferredParser<B>();
  }
  private constructor(
    readonly description = {
      name: "Deferred",
      children: [],
      extras: [],
    } as const,
  ) {}
  /**
   * Sets the underlying parser for this deferred parser.
   * Must be called before parsing to avoid errors.
   * @param parser - The parser to use for validation.
   * @returns This DeferredParser for chaining.
   */
  setParser(parser: IParser<unknown, B>) {
    this.parser = new Parser(parser);
    return this;
  }
  /**
   * Parses the input using the underlying parser.
   * @param a - The input value.
   * @param onParse - The callbacks for success and failure.
   * @returns The parsed value on success, or an error if not set up.
   */
  parse<C, D>(a: unknown, onParse: OnParse<unknown, B, C, D>): C | D {
    if (!this.parser) {
      return onParse.invalid({
        value: "Not Set Up",
        keys: [],
        parser: this,
      });
    }
    return this.parser.parse(a, onParse);
  }
}

/**
 * Creates a deferred parser for recursive or mutually recursive types.
 * Returns a tuple of the parser and a setter function.
 *
 * @example
 * ```ts
 * type Tree = { type: 'leaf', value: number } | { type: 'branch', children: Tree[] }
 * const [matchTree, setMatchTree] = deferred<Tree>();
 * const matchBranch = shape({
 *   type: literal('branch'),
 *   children: arrayOf(matchTree),
 * });
 * setMatchTree(some(literal('leaf').map(v => ({ type: 'leaf', value: v })), matchBranch));
 * ```
 *
 * @typeParam B - The expected output type (must be provided explicitly).
 * @returns A tuple of `[Parser<unknown, B>, (parser: IParser<unknown, B>) => void]`.
 */
export function deferred<B = never>() {
  const deferred = DeferredParser.create<B>();
  function setParser(parser: IParser<unknown, B>) {
    deferred.setParser(parser);
  }
  return [new Parser(deferred), setParser] as const;
}
