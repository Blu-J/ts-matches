import { Parser } from "./index";

/**
 * The NonNull type is a utility type that takes two generic parameters, A and B.
 * It checks if the type A is either null or undefined. If it is, then the resulting
 * type is B; otherwise, it is A itself.
 */
export type NonNull<A, B> = A extends null | undefined ? B : A;

/**
 * The EnsureParser type is a utility type that ensures its generic parameter P is of type IParser<any, any>.
 * If P does not match this type, the resulting type is never; otherwise, it is P itself.
 */
export type EnsureParser<P> = P extends IParser<any, any> ? P : never;

/**
 * The ParserInto type is a utility type that extracts the output type from an IParser instance.
 * It infers the output type A from the second type parameter of IParser<unknown, A>.
 */
export type ParserInto<P> = P extends IParser<any, infer A> ? A : never;

/**
 * The ParserFrom type is a utility type that extracts the input type from an IParser instance.
 * It infers the input type A from the first type parameter of IParser<A, unknown>.
 */
export type ParserFrom<P> = P extends IParser<infer A, any> ? A : never;

/**
 * The Nil type represents either null or undefined. This utility type is used to define nullable values.
 */
export type Nil = null | undefined;

/**
 * The Optional type is a utility type that makes its generic parameter A optional by allowing it to be of type A or undefined.
 */
export type Optional<A> = A | undefined;

/**
 * The _ type is an helper type that returns the squashed identity of what is passed in. This utility type can be used for readability purposes.
 */
export type _<T> = T;

/**
 * The SomeParser type represents a parser instance with unknown input and output types. It is used as a generic type constraint.
 */
export type SomeParser = IParser<unknown, unknown>;
export type ISimpleParsedError = {
  parser: SomeParser;
  value: any;
  keys: string[];
};
export type ValidatorError = ISimpleParsedError;
export type IParser<A, B> = {
  readonly description: Readonly<Description & {}>;
  parse<C, D>(this: IParser<A, B>, a: A, onParse: OnParse<A, B, C, D>): C | D;
  fromDescription(description: Description): IParser<A, B>;
};
export type Description = {
  readonly name: ParserNames;
  readonly extras: ReadonlyArray<unknown>;
  readonly children: ReadonlyArray<SomeParser>;
} & (
  | {
      readonly name: "ArrayOf";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Named";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [string];
    }
  | {
      readonly name: "Concat";
      readonly children: readonly [SomeParser, SomeParser];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Default";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  | {
      readonly name: "Nullable";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  | {
      readonly name: "OnMismatch";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  | {
      readonly name: "WithRetry";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  | {
      readonly name: "Tuple";
      readonly children: ReadonlyArray<SomeParser>;
      readonly extras: readonly [Parser<unknown, number>];
    }
  | {
      readonly name: "Dictionary";
      readonly children: ReadonlyArray<SomeParser>;
      readonly extras: readonly [];
    }
  | {
      readonly name: "Deferred";
      readonly children: readonly [];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Guard";
      readonly children: readonly [];
      readonly extras: readonly [unknown];
    }
  | {
      readonly name: "Literal";
      readonly children: readonly [];
      readonly extras: ReadonlyArray<unknown>;
    }
  | {
      readonly name: "Mapped";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [Function, string];
    }
  | {
      readonly name: "Maybe";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Nullable";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Recursive";
      readonly children: readonly [];
      readonly extras: readonly [Function];
    }
  | {
      readonly name: "Or";
      readonly children: readonly [SomeParser, SomeParser];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Wrapper";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  | {
      readonly name: "Shape" | "Partial";
      readonly children: ReadonlyArray<SomeParser>;
      readonly extras: ReadonlyArray<string | number>;
    }
  | {
      readonly name:
        | "Any"
        | "Unknown"
        | "Null"
        | "Number"
        | "Boolean"
        | "Function"
        | "String"
        | "Object"
        | "Array";
      readonly children: readonly [];
      readonly extras: readonly [];
    }
);

export type ParserNames =
  | "Any"
  | "Array"
  | "ArrayOf"
  | "Boolean"
  | "Concat"
  | "Default"
  | "Deferred"
  | "Named"
  | "Dictionary"
  | "Function"
  | "Guard"
  | "Literal"
  | "Mapped"
  | "Maybe"
  | "Nullable"
  | "Named"
  | "Null"
  | "Number"
  | "Partial"
  | "Object"
  | "OnMismatch"
  | "Or"
  | "Recursive"
  | "Shape"
  | "String"
  | "Tuple"
  | "Unknown"
  | "Wrapper"
  | "WithRetry"
  | "Nullable";

export type OnParse<A, B, C, D> = {
  parsed(b: B): C;
  invalid(error: ISimpleParsedError): D;
};

export type AndParser<P1, P2> =
  [P1, P2] extends [Parser<infer A1, infer B1>, Parser<infer A2, infer B2>] ?
    Parser<A1 & A2, B1 & B2>
  : never;

export type OrParser<P1, P2> =
  [P1, P2] extends [Parser<infer A1, infer B1>, Parser<infer A2, infer B2>] ?
    Parser<A1 | A2, B1 | B2>
  : never;
