import matches from "./matches.ts";
import { any, every, Parser, shape } from "./parsers/index.ts";
import { saferStringify } from "./utils.ts";
import { expect } from "https://deno.land/x/expect/mod.ts";
import { assertSnapshot, isType } from "./matches.test.ts";
const { test } = Deno;

export const validatorError = every(
  shape({
    parser: matches.object,
    keys: matches.arrayOf(matches.string),
    value: any,
  }),
);

const unFold = {
  invalid: Parser.validatorErrorAsString,
  parsed: (x: any): any => x,
};
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
      validator.parse(testValue, unFold),
    );
    return;
  }
  throw new Error("should be invalid");
});
test("simple recursive shape with invalid", () => {
  type Recursive = {
    test: string | Recursive;
  };
  const testValue = { test: "test" };
  const validator = matches.recursive<Recursive>((self) =>
    matches.shape({ test: matches.some(matches.string, self) })
  );
  (validator.parser as any).parser = null;
  try {
    validator.unsafeCast(testValue);
  } catch (e) {
    assertSnapshot(
      '"Recursive<>(\\"Recursive Invalid State\\")"',
      validator.parse(testValue, unFold),
    );
    return;
  }
  throw new Error("should be invalid");
});
