import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("AnyParser", () => {
  test("should accept any value", () => {
    const testValue = 0;
    const validator = matches.any;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should accept any value (string)", () => {
    const testValue = "hello";
    const validator = matches.any;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should accept any value (object)", () => {
    const testValue = { a: 1 };
    const validator = matches.any;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should accept null", () => {
    const testValue = null;
    const validator = matches.any;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should accept undefined", () => {
    const testValue = undefined;
    const validator = matches.any;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });
});
