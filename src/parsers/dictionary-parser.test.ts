import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("DictionaryParser", () => {
  test("should validate correct dictionary shape", () => {
    const testMatcher = matches.dictionary(
      [matches.literal("test"), matches.literal("value")],
      [matches.literal("test2"), matches.literal("value2")],
    );
    const input = { test: "value", test2: "value2" };
    const output: {
      test: "value";
      test2: "value2";
    } = testMatcher.unsafeCast(input);
    expect(output).toEqual(input);
  });

  test("should reject incorrect dictionary value", () => {
    const testMatcher = matches.dictionary(
      [matches.literal("test"), matches.literal("value")],
      [matches.literal("test2"), matches.literal("value2")],
    );
    const input = { test: "invalid", test2: "value2" };
    const output = testMatcher.parse(input, unFold);
    assertSnapshot(`"[test]Literal<\\"value\\">(\\"invalid\\")"`, output);
  });

  test("should accept any dictionary when no constraints", () => {
    const testMatcher = matches.dictionary();
    const input = { test: "invalid", test2: "value2" };
    const output = testMatcher.parse(input, unFold);
    assertSnapshot(`{"test":"invalid","test2":"value2"}`, output);
  });

  test("should validate deep dictionary shape", () => {
    const input = [
      {
        second: "invalid",
      },
    ];
    const output = matches
      .tuple(
        matches.shape({
          second: matches.literal("valid"),
        }),
      )
      .parse(input, unFold);
    assertSnapshot(
      `"[\\"0\\"][\\"second\\"]Literal<\\"valid\\">(\\"invalid\\")"`,
      output,
    );
  });

  test("should validate tuple exact shape", () => {
    const input = [1, 2, 3];
    const matcher = matches.tuple(
      matches.number,
      matches.literal(2),
      matches.number,
    );
    const outputRight1: [number, number, number] = matcher.unsafeCast(input);
    expect(outputRight1).toEqual(input);
  });

  test("should project dictionary values", () => {
    const input = { test: "value" };
    const matcher = matches.dictionary([
      matches.literal("test"),
      matches.literal("value").map((_x) => `value2` as const),
    ]);
    const outputMostCorrect: { test: "value2" } = matcher.unsafeCast(input);
    expect(outputMostCorrect.test).toEqual("value2");
  });

  test("should still reject values after projection", () => {
    const input = { test: "value2" };
    const matcher = matches.dictionary([
      matches.literal("test"),
      matches.literal("value").map((_x) => `value2` as const),
    ]);
    const output = matcher.parse(input, unFold);
    assertSnapshot(`"[test]Literal<\\"value\\">(\\"value2\\")"`, output);
  });

  test("should project dictionary keys", () => {
    const input = { test: "value" };
    const matcher = matches.dictionary([
      matches.literal("test").map((_x) => "projected" as const),
      matches.literal("value"),
    ]);
    const output: { projected: "value" } = matcher.unsafeCast(input);
    expect(output.projected).toEqual("value");
  });

  test("should preserve dictionary key order", () => {
    const dataIn = {
      A: 1,
      B: 1,
      C: 1,
    };
    const expectedKeys = JSON.stringify(Object.keys(dataIn));
    const newShape = matches(dataIn)
      .when(matches.dictionary([matches.string, matches.unknown]), (x) => x)
      .defaultToLazy(() => {
        throw new Error("Should match");
      });
    const actualKeys = JSON.stringify(Object.keys(newShape));
    expect(actualKeys).toEqual(expectedKeys);
  });
});
