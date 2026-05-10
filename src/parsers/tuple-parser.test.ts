import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("TupleParser", () => {
  test("should validate tuple(number, string)", () => {
    const testValue = [4, "test"];
    const validator = matches.tuple(matches.number, matches.string);
    const output: [number, string] = validator.parse(testValue, unFold);
    expect(output).toEqual(testValue);
  });

  test("should reject tuple(number, string) with failure", () => {
    const testValue = ["bad", 5];
    const validator = matches.tuple(matches.number, matches.string);
    assertSnapshot(
      '"[\\"0\\"]number(\\"bad\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should validate exact tuple shape", () => {
    const input = [1, 2, 3];
    const matcher = matches.tuple(
      matches.number,
      matches.literal(2),
      matches.number,
    );
    const outputRight: [number, number, number] = matcher.unsafeCast(input);
    expect(outputRight).toEqual(input);
  });
});
