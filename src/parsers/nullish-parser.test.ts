import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("NullishParser", () => {
  test("with a number.mapNullish matcher: a number in", () => {
    const input = 4;
    const maybeNumber = matches.number.mapNullish(0);
    const expected = 4;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.mapNullish matcher: a null in", () => {
    const input = null;
    const maybeNumber = matches.number.mapNullish(0);
    const expected = 0;
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.mapNullish matcher: a undefined in", () => {
    const input = undefined;
    const maybeNumber = matches.number.mapNullish(0);
    const expected = "Nullable<0,Nullable<number>>(undefined)";
    expect(maybeNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.mapNullish matcher: a object in", () => {
    const input = {};
    const maybeNumber = matches.number.mapNullish(0);
    assertSnapshot(
      '"Nullable<0,Nullable<number>>({})"',
      maybeNumber.parse(input, unFold),
    );
  });
});
