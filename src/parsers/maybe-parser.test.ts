import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("MaybeParser", () => {
  test("with a number.maybe matcher: a number in", () => {
    const input = 4;
    const maybeNumber = matches.number.optional();
    const expectedAnswer = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expectedAnswer);
  });

  test("with a number.maybe matcher: a null in", () => {
    const input = null;
    const maybeNumber = matches.number.optional();
    expect(maybeNumber.parse(input, unFold)).toBe("Maybe<number>(null)");
  });

  test("with a number.maybe matcher: a undefined in", () => {
    const input = undefined;
    const maybeNumber = matches.number.optional();
    expect(maybeNumber.parse(input, unFold)).toBe(undefined);
  });

  test("with a number.maybe matcher: a object in", () => {
    const input = {};
    const maybeNumber = matches.number.optional();
    assertSnapshot(
      '"\\"Maybe<number>({})\\""',
      JSON.stringify(maybeNumber.parse(input, unFold)),
    );
  });
});
