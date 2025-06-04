import { IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";

/**
 * This is needed when the typescript has a recursive, mutual types
 * type Things = string | [OtherThings]
 * type OtherThings = {type: 'other', value:Things }
 */
export class DeferredParser<B> implements IParser<unknown, B> {
  private parser?: Parser<unknown, B>;
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
  setParser(parser: IParser<unknown, B>) {
    this.parser = new Parser(parser);
    return this;
  }
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
 * Must pass the shape that we expect since typescript as of this point
 * can't infer with recursive like structures like this.
 * @returns [Parser, setParser] Use the setParser to set the parser later
 */
export function deferred<B = never>() {
  const deferred = DeferredParser.create<B>();
  function setParser(parser: IParser<unknown, B>) {
    deferred.setParser(parser);
  }
  return [new Parser(deferred), setParser] as const;
}
