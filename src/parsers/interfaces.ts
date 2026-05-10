import { Parser } from "./index";

/**
 * Type utility: if `A` is `null | undefined`, return `B`, otherwise return `A`.
 */
export type NonNull<A, B> = A extends null | undefined ? B : A;

/**
 * Type utility: ensures `P` is an `IParser`.
 */
export type EnsureParser<P> = P extends IParser<any, any> ? P : never;

/**
 * Extracts the output type `A` from an `IParser<any, A>`.
 */
export type ParserInto<P> = P extends IParser<any, infer A> ? A : never;

/**
 * Extracts the input type `A` from an `IParser<A, any>`.
 */
export type ParserFrom<P> = P extends IParser<infer A, any> ? A : never;

/**
 * Represents `null | undefined`.
 */
export type Nil = null | undefined;

/**
 * Represents an optional value (value or `undefined`).
 */
export type Optional<A> = A | undefined;

/**
 * Identity type utility.
 */
export type _<T> = T;

/**
 * Represents any parser type.
 */
export type SomeParser = IParser<unknown, unknown>;

/**
 * Represents a simple parsing error containing the parser, value, and keys.
 */
export type ISimpleParsedError = {
  parser: SomeParser;
  value: any;
  keys: string[];
};

/**
 * Alias for `ISimpleParsedError`.
 */
export type ValidatorError = ISimpleParsedError;

/**
 * Represents the minimal interface for a parser.
 * @typeParam A - The input type the parser accepts.
 * @typeParam B - The output type the parser produces.
 */
export type IParser<A, B> = {
  readonly description: Readonly<Description & {}>;
  parse<C, D>(this: IParser<A, B>, a: A, onParse: OnParse<A, B, C, D>): C | D;
};
/**
 * Represents the description of a parser, including its name, children parsers, and extras.
 * This type is discriminated by the `name` property.
 */
export type Description = {
  readonly name: ParserNames;
  readonly extras: ReadonlyArray<unknown>;
  readonly children: ReadonlyArray<SomeParser>;
} & (
  /** ArrayOf parser: validates arrays of a specific type. */
  | {
      readonly name: "ArrayOf";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  /** Named parser: gives a parser a custom name for error messages. */
  | {
      readonly name: "Named";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [string];
    }
  /** Concat parser: combines two parsers sequentially. */
  | {
      readonly name: "Concat";
      readonly children: readonly [SomeParser, SomeParser];
      readonly extras: readonly [];
    }
  /** Default parser: provides a fallback value for undefined. */
  | {
      readonly name: "Default";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  /** Nullable parser: allows null as a valid value. */
  | {
      readonly name: "Nullable";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  /** OnMismatch parser: provides a fallback value on parse failure. */
  | {
      readonly name: "OnMismatch";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  /** WithRetry parser: retries parsing with a fallback value on failure. */
  | {
      readonly name: "WithRetry";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [unknown];
    }
  /** Tuple parser: validates a fixed-length tuple of specific types. */
  | {
      readonly name: "Tuple";
      readonly children: ReadonlyArray<SomeParser>;
      readonly extras: readonly [];
    }
  /** Dictionary parser: validates key-value pairs with key/value parsers. */
  | {
      readonly name: "Dictionary";
      readonly children: ReadonlyArray<SomeParser>;
      readonly extras: readonly [];
    }
  /** Deferred parser: a parser whose implementation is set later. */
  | {
      readonly name: "Deferred";
      readonly children: readonly [];
      readonly extras: readonly [];
    }
  /** Guard parser: validates using a custom predicate function. */
  | {
      readonly name: "Guard";
      readonly children: readonly [];
      readonly extras: readonly [unknown];
    }
  /** Literal parser: validates an exact literal value. */
  | {
      readonly name: "Literal";
      readonly children: readonly [];
      readonly extras: ReadonlyArray<unknown>;
    }
  /** Mapped parser: transforms the output of a parser. */
  | {
      readonly name: "Mapped";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [string];
    }
  /** Maybe parser: allows undefined as a valid value. */
  | {
      readonly name: "Maybe";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  /** Nullable parser (duplicate name, allows null). */
  | {
      readonly name: "Nullable";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  /** Recursive parser: for self-referential types. */
  | {
      readonly name: "Recursive";
      readonly children: readonly [];
      readonly extras: readonly [Function];
    }
  /** Or parser: validates using one of two parsers (union). */
  | {
      readonly name: "Or";
      readonly children: readonly [SomeParser, SomeParser];
      readonly extras: readonly [];
    }
  /** Wrapper parser: wraps another parser. */
  | {
      readonly name: "Wrapper";
      readonly children: readonly [SomeParser];
      readonly extras: readonly [];
    }
  /** Shape or Partial parser: validates object shapes. */
  | {
      readonly name: "Shape" | "Partial";
      readonly children: ReadonlyArray<SomeParser>;
      readonly extras: ReadonlyArray<string | number>;
    }
  /** Simple type parsers (any, unknown, null, number, boolean, function, string, object, array). */
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

/**
 * All possible parser description names used by the ts-matches library.
 * Each name corresponds to a specific parser type and its description shape.
 */
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
