import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("StringParser", () => {
  test("should validate a string", () => {
    const testValue = "a";
    const validator = matches.string;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-string", () => {
    const testValue = 5;
    const validator = matches.string;
    assertSnapshot('"string(5)"', validator.parse(testValue, unFold));
  });
});
