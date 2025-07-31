import { Description, IParser, OnParse } from "./interfaces";
import { Parser } from "./parser";
import { OneOf } from "./utils";

function eq(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === b.length) {
        return a.findIndex((a, idx) => !eq(a, b[idx])) === -1;
      }
    } else if (a && b && !Array.isArray(a) && !Array.isArray(b)) {
      return eq(
        Object.entries(a).sort(([a, _a], [b, _b]) => a.localeCompare(b)),
        Object.entries(b).sort(([a, _a], [b, _b]) => a.localeCompare(b)),
      );
    }
  }
  return false;
}

const NAME = "Literal";
export class LiteralsParser<B extends unknown[]>
  implements IParser<unknown, OneOf<B>>
{
  static of<B extends unknown[]>(values: B) {
    return new LiteralsParser({
      name: NAME,
      children: [],
      extras: values,
    });
  }
  constructor(
    readonly description: {
      name: typeof NAME;
      children: [];
      extras: B;
    },
  ) {}
  get values() {
    return this.description.extras;
  }
  fromDescription(description: Description): IParser<unknown, OneOf<B>> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }
    return new LiteralsParser(description as typeof this.description);
  }
  parse<C, D>(a: unknown, onParse: OnParse<unknown, OneOf<B>, C, D>): C | D {
    for (const value of this.values) {
      if (eq(value, a)) return onParse.parsed(a as OneOf<B>);
    }

    return onParse.invalid({
      value: a,
      keys: [],
      parser: this,
    });
  }
}

export function literal<
  A extends
    | string
    | number
    | bigint
    | boolean
    | symbol
    | undefined
    | object
    | null,
>(isEqualToValue: A) {
  return new Parser(LiteralsParser.of<[A]>([isEqualToValue]));
}

export function literals<
  A extends
    | string
    | number
    | bigint
    | boolean
    | symbol
    | undefined
    | object
    | null,
  Rest extends Array<
    string | number | bigint | boolean | symbol | undefined | object | null
  >,
>(firstValue: A, ...restValues: Rest): Parser<unknown, A | OneOf<Rest>> {
  return new Parser(LiteralsParser.of([firstValue, ...restValues]));
}
