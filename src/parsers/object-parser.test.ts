import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("ObjectParser", () => {
  test("should validate an object", () => {
    const testValue = {};
    const validator = matches.object;
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-object", () => {
    const testValue = 5;
    const validator = matches.object;
    expect(validator.parse(testValue, unFold)).toEqual("object(5)");
  });

  test("should validate a class instance as object", () => {
    class Event {
      constructor(readonly type: string) {}
    }
    const event = new Event("test");
    expect(matches.object.parse(event, unFold)).toBe(event);
  });
});
