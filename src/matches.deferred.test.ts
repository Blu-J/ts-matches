import matches from "./matches.ts";
import {
  Parser,
  any,
  every,
  shape,
  deferred,
  literal,
  tuple,
  some,
  string,
} from "./parsers/index.ts";
import { saferStringify } from "./utils.ts";
import { expect } from "https://deno.land/x/expect/mod.ts";
import { assertSnapshot, isType } from "./matches.test.ts";
const { test } = Deno;

export const validatorError = every(
  shape({
    parser: matches.object,
    keys: matches.arrayOf(matches.string),
    value: any,
  })
);
const unFold = {
  invalid: Parser.validatorErrorAsString,
  parsed: (x: any): any => x,
};

{
  type Things = string | [OtherThings];
  type OtherThings = { type: "other"; value: Things };
  const [matchThings, setMatchThings] = deferred<Things>();
  const matchOtherThings = shape({
    type: literal("other"),
    value: matchThings,
  });
  setMatchThings(some(string, tuple(matchOtherThings)));
  test("simple deferred shape", () => {
    const testValue = [
      { type: "other", value: [{ type: "other", value: "test" }] },
    ];
    const parsed = matchThings.unsafeCast(testValue);
    expect(parsed).toEqual(testValue);
    // @ts-expect-error
    isType<number>(parsed);
    isType<Things>(parsed);
  });
  test("simple deferred shape invalid", () => {
    const testValue = [
      { type: "other", value: [{ type: "ot2her", value: "test" }] },
    ];

    try {
      const parsed = matchThings.unsafeCast(testValue);
    } catch (e) {
      assertSnapshot(
        '"[\\"0\\"][\\"value\\"][\\"0\\"][\\"type\\"]Or<string,...>(\\"ot2her\\")"',
        matchThings.parse(testValue, unFold)
      );
      return;
    }
    throw new Error("should be invalid");
  });
}
