import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("OnMismatch", () => {
  test("with a number.onMismatch matcher: a number in", () => {
    const input = 4;
    const maybeNumber = matches.number.onMismatch(0);
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.onMismatch matcher: a null in", () => {
    const input = null;
    const maybeNumber = matches.number.onMismatch(0);
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.onMismatch matcher: a undefined in", () => {
    const input = undefined;
    const maybeNumber = matches.number.onMismatch(0);
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.onMismatch matcher: a object in", () => {
    const input = {};
    const maybeNumber = matches.number.onMismatch(0);
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`0`);
  });

  test("with a number.onMismatch matcher: a string in", () => {
    const input = "4";
    const maybeNumber = matches.number.onMismatch(0);
    expect(maybeNumber.parse(input, unFold)).toMatchInlineSnapshot(`0`);
  });
});
