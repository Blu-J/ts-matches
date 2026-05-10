import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("LiteralParser", () => {
  test("should validate a literal string", () => {
    const testValue = "a";
    const validator = matches.literal("a");
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate a literal number", () => {
    const testValue = 5 as const;
    const value = matches(testValue)
      .when(5, 2 as const)
      .unwrap();
    expect(value).toEqual(2);
  });

  test("should validate literal NaN", () => {
    expect(() => matches.literal(NaN).unsafeCast(NaN)).not.toThrow();
  });

  test("should validate an array literal", () => {
    const testValue = ["a", "b"];
    const validator = matches.literal(["a", "b"] as const);
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate an object literal", () => {
    const testValue = { a: "a", b: ["c", "d"] };
    const validator = matches.literal({ a: "a", b: ["c", "d"] as const });
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-matching literal", () => {
    const testValue = "a";
    const validator = matches.literal("b");
    assertSnapshot(
      '"Literal<\\"b\\">(\\"a\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should match several literals", () => {
    const testValue = 5 as const;
    const value = matches(testValue)
      .when(2, 5, () => 2 as const)
      .unwrap();
    expect(value).toEqual(2);
  });

  test("should match literals with .literals()", () => {
    const matcher = matches.literals(4, "3");
    const firstExpectedOutcome: 4 | "3" = matcher.parse(4, unFold);
    expect(firstExpectedOutcome).toEqual(4);
    expect(matcher.parse("3", unFold)).toEqual("3");
    assertSnapshot('"Literal<4,\\"3\\">(3)"', matcher.parse(3, unFold));
    assertSnapshot('"Literal<4,\\"3\\">(\\"4\\")"', matcher.parse("4", unFold));
  });

  test("should match literal lazy", () => {
    const testValue = 5 as const;
    const value = matches(testValue)
      .when(5, () => 2 as const)
      .unwrap();
    expect(value).toEqual(2);
  });

  test("should match default literal", () => {
    expect(matches(5).when("5").unwrap()).toEqual("5");
  });
});
