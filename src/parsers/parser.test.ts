import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("Parser (core class)", () => {
  test("should be able to test shape", () => {
    const testValue = { a: "c" };
    const validator = matches.shape({ a: matches.literal("c") });
    expect(validator.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should not get an error message for missing key when present", () => {
    const testValue = { a: "c" };
    const validator = matches.shape({ a: matches.any });
    const message = validator.errorMessage(testValue);
    expect(message).toEqual(undefined);
  });

  test("should fail for missing key", () => {
    const testValue = {};
    const validator = matches.shape({ a: matches.any });
    assertSnapshot(
      '"[\\"a\\"]Shape<{a:any}>(\\"missingProperty\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should get an error message for missing key", () => {
    const testValue = {};
    const validator = matches.shape({ a: matches.any });
    const message = validator.errorMessage(testValue);
    assertSnapshot('"[\\"a\\"]Shape<{a:any}>(\\"missingProperty\\")"', message);
  });

  test("should be able to test shape with failure", () => {
    const testValue = { a: "c" };
    const validator = matches.shape({ a: matches.literal("b") });
    assertSnapshot(
      '"[\\"a\\"]Literal<\\"b\\">(\\"c\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should be able to test shape with failure: not object", () => {
    const testValue = 5;
    const validator = matches.shape({ a: matches.literal("b") });
    expect(validator.parse(testValue, unFold)).toEqual(
      `Shape<{a:Literal<\"b\">}>(${JSON.stringify(testValue)})`,
    );
  });

  test("should be able to test shape with failure (multiple keys)", () => {
    const testValue = {};
    const validator = matches.shape({
      a: matches.literal("b"),
      b: matches.literal("b"),
    });
    assertSnapshot(
      '"[\\"a\\"]Shape<{a:Literal<\\"b\\">,b:Literal<\\"b\\">}>(\\"missingProperty\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should be able to test shape with failure smaller", () => {
    const testValue = { a: "b" };
    const validator = matches.shape({
      a: matches.literal("b"),
      b: matches.literal("b"),
    });
    assertSnapshot(
      '"[\\"b\\"]Shape<{a:Literal<\\"b\\">,b:Literal<\\"b\\">}>(\\"missingProperty\\")"',
      validator.parse(testValue, unFold),
    );
  });

  test("should recover shape mismatch", () => {
    const validator = matches.shape({
      a: matches
        .shape({
          b: matches.number.onMismatch(-1),
        })
        .withMismatch(() => ({ b: -2 })),
    });

    expect(validator.parse({}, unFold)).toEqual({ a: { b: -2 } });
    expect(validator.parse({ a: {} }, unFold)).toEqual({ a: { b: -1 } });
    expect(validator.parse({ a: { b: 5 } }, unFold)).toEqual({ a: { b: 5 } });
  });

  test("should recover shape retry", () => {
    const validator = matches.shape({
      a: matches
        .shape({
          b: matches.number.onRetry(-1),
        })
        .withRetry(() => ({ b: -2 })),
    });

    expect(validator.parse({}, unFold)).toEqual({ a: { b: -2 } });
    expect(validator.parse({ a: {} }, unFold)).toEqual({ a: { b: -1 } });
    expect(validator.parse({ a: { b: 5 } }, unFold)).toEqual({ a: { b: 5 } });
  });

  test("should recover shape retry bad", () => {
    const validator = matches.shape({
      a: matches
        .shape({
          b: matches.number.onRetry("-1"),
        })
        .withRetry(() => "{ b: -2 }"),
    });

    expect(validator.parse({}, unFold)).toEqual(
      '[TypeError: Failed type: Partial<{b:WithRetry<,number>}>(undefined) given input undefined]Mapped<"",Partial<{a:WithRetry<,Mapped<"",Partial<{b:WithRetry<,number>}>>>}>>({})',
    );
    expect(validator.parse({ a: {} }, unFold)).toEqual(
      '["a"][TypeError: Failed type: number(undefined) given input undefined]Mapped<"",Partial<{b:WithRetry<,number>}>>({})',
    );
    expect(validator.parse({ a: { b: 5 } }, unFold)).toEqual({ a: { b: 5 } });
  });

  test("should throw on invalid unsafe match throw", () => {
    try {
      matches.partial({}).unsafeCast(5);
    } catch (e: any) {
      assertSnapshot('"Failed type: Partial<{}>(5) given input 5"', e.message);
    }
  });

  test("should throw on invalid castPromise", async () => {
    try {
      await matches.partial({}).castPromise(5);
      expect("never").toBe("called");
    } catch (e: any) {
      assertSnapshot(`{}`, e);
    }
  });

  test("should resolve castPromise on success", async () => {
    expect(await matches.literal(5).castPromise(5)).toBe(5);
  });

  test("should be able to test is object for event", () => {
    class Event {
      constructor(readonly type: string) {}
    }
    const event = new Event("test");
    expect(matches.object.parse(event, unFold)).toBe(event);
  });
});
