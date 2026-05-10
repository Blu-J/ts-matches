import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("UnknownParser", () => {
  test("should validate any value as unknown", () => {
    const testValue = 4;
    const validator = matches.unknown;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate string as unknown", () => {
    const testValue = "hello";
    const validator = matches.unknown;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate object as unknown", () => {
    const testValue = { a: 1 };
    const validator = matches.unknown;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate null as unknown", () => {
    const testValue = null;
    const validator = matches.unknown;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });
});
