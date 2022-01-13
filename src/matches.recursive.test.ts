import matches from "./matches.ts";
import { Parser, any, every, shape } from "./parsers/index.ts";
import { saferStringify } from "./utils.ts";
import { expect } from "https://deno.land/x/expect/mod.ts";
import { assertSnapshot } from "./matches.test.ts";
const { test } = Deno;

const isNumber = (x: unknown): x is number => typeof x === "number";
class Event {
  constructor(readonly type: string) {}
}
export const validatorError = every(
  shape({
    parser: matches.object,
    keys: matches.arrayOf(matches.string),
    value: any,
  })
);
type AssertNever<A> = A extends string | number | boolean | object | Function
  ? A
  : never;
function assertNeverUnknown<A>(a: AssertNever<A>): A {
  return a;
}

const unFold = {
  invalid: Parser.validatorErrorAsString,
  parsed: (x: any): any => x,
};
const stringFold = {
  invalid: (x: any): any => `invalid(${saferStringify(x)})`,
  parsed: (x: any): any => `parsed(${saferStringify(x)})`,
};

type Recursive = {
  [name: string]: string | Recursive;
};

function isType<T>(x: T) {}
test("simple recursive option", () => {
  type Recursive = number | [Recursive];
  const testValue = [4];
  const validator = matches.recursive<Recursive>((self) =>
    matches.some(matches.number, matches.tuple(self))
  );
  const parsed = validator.unsafeCast(testValue);
  expect(parsed).toEqual(testValue);
  // @ts-expect-error
  isType<number>(parsed);
  isType<Recursive>(parsed);
});
test("simple recursive shape", () => {
  type Recursive = {
    test: string | Recursive;
  };
  const testValue = { test: { test: "test" } };
  const validator = matches.recursive<Recursive>((self) =>
    matches.shape({ test: matches.some(matches.string, self) })
  );
  const parsed = validator.unsafeCast(testValue);
  expect(parsed).toEqual(testValue);
  // @ts-expect-error
  isType<number>(parsed);
  isType<Recursive>(parsed);
});

test("simple recursive shape with invalid", () => {
  type Recursive = {
    test: string | Recursive;
  };
  const testValue = [4];
  const validator = matches.recursive<Recursive>((self) =>
    matches.shape({ test: matches.some(matches.string, self) })
  );
  try {
    validator.unsafeCast(testValue);
  } catch (e) {
    assertSnapshot(
      '"[\\"test\\"]Shape<{test:Or<string,...>}>(\\"missingProperty\\")"',
      validator.parse(testValue, unFold)
    );
    return;
  }
  throw new Error("should be invalid");
});
