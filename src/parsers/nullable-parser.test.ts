import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("NullableParser", () => {
  test("with a number.nullable matcher: a number in", () => {
    const input = 4;
    const nullableNumber = matches.number.nullable();
    const expectedAnswer = 4;
    expect(nullableNumber.parse(input, unFold)).toBe(expectedAnswer);
  });

  test("with a number.nullable matcher: a null in", () => {
    const input = null;
    const nullableNumber = matches.number.nullable();
    expect(nullableNumber.parse(input, unFold)).toBe(null);
  });

  test("with a number.nullable matcher: a undefined in", () => {
    const input = undefined;
    const nullableNumber = matches.number.nullable();
    assertSnapshot(
      '"Nullable<number>(undefined)"',
      nullableNumber.parse(input, unFold),
    );
  });

  test("with a number.nullable matcher: a object in", () => {
    const input = {};
    const nullableNumber = matches.number.nullable();
    assertSnapshot(
      '"\\"Nullable<number>({})\\""',
      JSON.stringify(nullableNumber.parse(input, unFold)),
    );
  });
});
