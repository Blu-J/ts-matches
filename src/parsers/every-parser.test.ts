import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("EveryParser", () => {
  test("should validate intersection of matchers", () => {
    const testValue = 4;
    const isEven = matches.guard(
      (x: unknown): x is number => typeof x === "number" && x % 2 === 0,
      "isEven",
    );
    const validator = matches.every(matches.number, isEven);
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject when one matcher fails", () => {
    const testValue = 5;
    const isEven = matches.guard(
      (x: unknown): x is number => typeof x === "number" && x % 2 === 0,
      "isEven",
    );
    const isGt6 = matches.guard(
      (x: unknown): x is number => typeof x === "number" && x > 6,
      "isGt6",
    );
    const validator = matches.every(matches.number, isEven, isGt6);
    assertSnapshot('"isEven(5)"', validator.parse(testValue, unFold));
  });

  test("should clean up anys", () => {
    const everyResult = matches.every(matches.any, matches.any);
    expect(everyResult).toEqual(matches.any);
  });
});
