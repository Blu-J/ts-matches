import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("NumberParser", () => {
  test("should validate a number", () => {
    const testValue = 4;
    const validator = matches.number;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-number", () => {
    const testValue = "a";
    const validator = matches.number;
    assertSnapshot('"number(\\"a\\")"', validator.parse(testValue, unFold));
  });

  test("should validate natural number", () => {
    const testValue = 0;
    const validator = matches.natural;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject negative natural number", () => {
    const testValue = -1;
    const validator = matches.natural;
    expect(validator.parse(testValue, unFold)).toEqual('Guard(-1)');
  });

  test("should reject non-integer natural number", () => {
    const testValue = 1.5;
    const validator = matches.natural;
    expect(validator.parse(testValue, unFold)).toEqual('Guard(1.5)');
  });
});
