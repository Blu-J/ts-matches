import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("WithRetry", () => {
  test("with a number.withRetry matcher: a number in", () => {
    const input = 4;
    const retryNumber = matches.number.withRetry((a) =>
      matches.string.test(a) ? Number.parseFloat(a) : a,
    );
    const expected = 4;
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withRetry matcher: a string number in", () => {
    const input = "7";
    const retryNumber = matches.number.withRetry((a) =>
      matches.string.test(a) ? Number.parseFloat(a) : a,
    );
    const expected = 7;
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withRetry matcher: a null in", () => {
    const input = null;
    const retryNumber = matches.number.withRetry((a) =>
      matches.string.test(a) ? Number.parseFloat(a) : a,
    );
    const expected = "number(null)";
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withRetry matcher: a undefined in", () => {
    const input = undefined;
    const retryNumber = matches.number.withRetry((a) =>
      matches.string.test(a) ? Number.parseFloat(a) : a,
    );
    const expected = "number(undefined)";
    expect(retryNumber.parse(input, unFold)).toBe(expected);
  });

  test("with a number.withRetry matcher: a object in", () => {
    const input = {};
    const retryNumber = matches.number.withRetry((a) =>
      matches.string.test(a) ? Number.parseFloat(a) : a,
    );
    assertSnapshot('"number({})"', retryNumber.parse(input, unFold));
  });
});
