import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("FunctionParser", () => {
  test("should validate a function", () => {
    const testValue = () => ({});
    const validator = matches.isFunction;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-function", () => {
    const testValue = "test";
    const validator = matches.isFunction;
    assertSnapshot('"Function(\\"test\\")"', validator.parse(testValue, unFold));
  });

  test("should reject an object as function", () => {
    const o: any = {};
    o.o = o;
    assertSnapshot(
      '"Function([object Object])"',
      matches.isFunction.parse(o, unFold),
    );
  });
});
