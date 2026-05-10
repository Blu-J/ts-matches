import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("DefaultParser", () => {
  test("with a number.defaultTo matcher: a number in", () => {
    const input = 4;
    const maybeNumber = matches.number.defaultTo(0);
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.defaultTo matcher: a null in", () => {
    const input = null;
    const maybeNumber = matches.number.defaultTo(0);
    const expected = "Default<0,Maybe<number>>(null)";
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.defaultTo matcher: a undefined in", () => {
    const input = undefined;
    const maybeNumber = matches.number.defaultTo(0);
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.defaultTo matcher: a object in", () => {
    const input = {};
    const maybeNumber = matches.number.defaultTo(0);
    assertSnapshot('"Default<0,Maybe<number>>({})"', maybeNumber.parse(input, unFold));
  });
});
