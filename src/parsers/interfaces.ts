import { Parser } from ".";

export type NonNull<A, B> = A extends null | undefined ? B : A;
export type EnsureParser<P> = P extends IParser<any, any> ? P : never;
export type ParserInto<P> = P extends IParser<any, infer A> ? A : never;
export type ParserFrom<P> = P extends IParser<infer A, any> ? A : never;
export type Nil = null | undefined;

export type Optional<A> = A | null | undefined;
export type _<T> = T;

export type ISimpleParsedError = {
  parser: IParser<unknown, unknown>;
  value: any;
  keys: string[];
};
export type ValidatorError = ISimpleParsedError;
export type IParser<A, B> = {
  readonly description: {
    readonly name: ParserNames;
    readonly extras: ReadonlyArray<unknown>;
    readonly children: ReadonlyArray<IParser<unknown, unknown>>;
  };
  parse<C, D>(this: IParser<A, B>, a: A, onParse: OnParse<A, B, C, D>): C | D;
};

export type ParserNames =
  | "Array"
  | "Concat"
  | "Default"
  | "Dictionary"
  | "Every"
  | "Guard"
  | "Literal"
  | "Mapped"
  | "Maybe"
  | "Named"
  | "Or"
  | "Shape"
  | "Wrapper";

export type OnParse<A, B, C, D> = {
  parsed(b: B): C;
  invalid(error: ISimpleParsedError): D;
};

export type AndParser<P1, P2> = [P1, P2] extends [
  Parser<infer A1, infer B1>,
  Parser<infer A2, infer B2>
]
  ? Parser<A1 & A2, B1 & B2>
  : never;

export type OrParser<P1, P2> = [P1, P2] extends [
  Parser<infer A1, infer B1>,
  Parser<infer A2, infer B2>
]
  ? Parser<A1 | A2, B1 | B2>
  : never;
