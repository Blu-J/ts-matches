import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("BoolParser", () => {
  test("should validate true", () => {
    const testValue = true;
    const validator = matches.boolean;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate false", () => {
    const testValue = false;
    const validator = matches.boolean;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a number", () => {
    const testValue = 0;
    const validator = matches.boolean;
    assertSnapshot('"boolean(0)"', validator.parse(testValue, unFold));
  });

  test("should reject a string", () => {
    const testValue = "test";
    const validator = matches.boolean;
    assertSnapshot('"boolean(\\"test\\")"', validator.parse(testValue, unFold));
  });

  test("should reject null", () => {
    const testValue = null;
    const validator = matches.boolean;
    expect(validator.parse(testValue, unFold)).toEqual('boolean(null)');
  });
});
