import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("NilParser", () => {
  test("should validate null", () => {
    const testValue = null;
    const validator = matches.nill;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate undefined", () => {
    const testValue = undefined;
    const validator = matches.nill;
    expect(validator.parse(testValue, unFold)).toEqual(undefined);
  });

  test("should reject non-nill value", () => {
    const testValue = 4;
    const validator = matches.nill;
    expect(validator.parse(testValue, unFold)).toEqual("null(4)");
  });
});
