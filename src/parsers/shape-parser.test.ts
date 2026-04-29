import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("ShapeParser", () => {
  test("should validate partial shape", () => {
    const testValue = {};
    const validator = matches.partial({ a: matches.literal("c") });
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should validate partial shape failure", () => {
    const testValue = { a: "a", b: "b" };
    const validator = matches.partial({
      a: matches.literal("c"),
      b: matches.literal("c"),
    });
    assertSnapshot(
      '"[\\"a\\"]Literal<\\"c\\">(\\"a\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should validate partial shape failure smaller", () => {
    const testValue = { b: "b" };
    const validator = matches.partial({
      a: matches.literal("c"),
      b: matches.literal("c"),
    });
    assertSnapshot(
      '"[\\"b\\"]Literal<\\"c\\">(\\"b\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should validate shape with optional partial not included", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").optional(),
    });
    const testValue = { a: "c" };
    const value = validator.unsafeCast(testValue);
    expect(value).toEqual(testValue);
    expect(value.b).toEqual(undefined);
  });

  test("should validate shape with partial correct", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").optional(),
    });
    const testValue = { a: "c", b: "d" };
    const value = validator.unsafeCast(testValue);
    expect(value).toEqual(testValue);
  });

  test("should reject shape with partial and main not included", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").optional(),
    });
    const testValue = { b: "d" };
    try {
      validator.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"[\\"a\\"]Shape<{a:Literal<\\"c\\">}>(\\"missingProperty\\")"',
        validator.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });

  test("should validate shape with value `b` as null", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").optional(),
    });
    const testValue = { b: null, a: "c" };
    expect(validator.parse(testValue, unFold)).toEqual(
      '["b"]Maybe<Literal<"d">>(null)',
    );
  });

  test("should validate shape with value `b` as undefined", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").optional(),
    });
    const testValue = { b: undefined, a: "c" };
    expect(validator.parse(testValue, unFold)).toEqual({
      a: "c",
      b: undefined,
    });
  });

  test("should reject shape with partial is wrong", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").optional(),
    });
    const testValue = { a: "c", b: "e" };
    try {
      validator.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"[\\"b\\"]Maybe<Literal<\\"d\\">>(\\"e\\")"',
        validator.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });

  test("should validate shape with partials and fill in defaults", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").defaultTo("d" as const),
      f: matches.literal("f").optional(),
    });
    const testValue = { a: "c" };
    const value = validator.unsafeCast(testValue);
    expect(value).toEqual({ a: "c", b: "d" });
    expect(value.b).toEqual("d");
  });

  test("should validate shape with nullable and fill in defaults", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").defaultTo("d" as const),
      f: matches.literal("f").nullable(),
    });
    const testValueCorrect = { a: "c", f: null };
    const value2 = validator.unsafeCast(testValueCorrect);
    expect(value2).toEqual({
      a: "c",
      f: null,
      b: "d",
    });
  });

  test("should reject shape with nullable and missing property", () => {
    const validator = matches.shape({
      a: matches.literal("c"),
      b: matches.literal("d").defaultTo("d" as const),
      f: matches.literal("f").nullable(),
    });
    const testValue = { a: "c" };
    const value = validator.parse(testValue, unFold);
    assertSnapshot(
      '"[\\"f\\"]Shape<{a:Literal<\\"c\\">,f:Nullable<Literal<\\"f\\">>}>(\\"missingProperty\\")"',
      value,
    );
  });
});
