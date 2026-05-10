import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("OrParsers", () => {
  test("should union several matchers", () => {
    const testValue = 4;
    const validator = matches.some(matches.number, matches.string);
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should be fallible union several matchers", () => {
    const testValue = false;
    const validator = matches.some(matches.number, matches.string);
    assertSnapshot(
      '"Or<string,number>(false)"',
      validator.parse(testValue, unFold),
    );
  });

  test("should be any if empty", () => {
    expect(matches.some()).toEqual(matches.any);
  });

  test("should only return unique matchers", () => {
    assertSnapshot(
      '"Or<number,Literal<\\"test\\">,number>(\\"hello\\")"',
      matches
        .some(matches.number, matches.literal("test"), matches.number)
        .parse("hello", unFold),
    );
  });

  test("should deduplicate identical matchers", () => {
    assertSnapshot(
      '"Or<number,number>(\\"hello\\")"',
      matches.some(matches.number, matches.number).parse("hello", unFold),
    );
  });
});
