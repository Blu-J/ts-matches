import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("ArrayParser", () => {
  test("should validate a valid array", () => {
    const testValue = ["test"];
    const validator = matches.array;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-array value", () => {
    const testValue = "test";
    const validator = matches.array;
    expect(validator.parse(testValue, unFold)).toEqual('Array<unknown>("test")');
  });

  test("should reject a number", () => {
    const testValue = 42;
    const validator = matches.array;
    expect(validator.parse(testValue, unFold)).toEqual('Array<unknown>(42)');
  });

  test("should reject an object", () => {
    const testValue = { a: 1 };
    const validator = matches.array;
    expect(validator.parse(testValue, unFold)).toEqual('Array<unknown>({"a":1})');
  });
});
