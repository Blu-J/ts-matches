import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("NamedParser", () => {
  test("should validate valid named literal", () => {
    const enumTest = matches.literals("A", "B").rename("enumTest");
    const input = "A";
    const _correctType: "A" | "B" = enumTest.unsafeCast(input);
    expect(enumTest.unsafeCast(input)).toEqual("A");
  });

  test("should reject invalid named literal with wrapped name", () => {
    const enumTest = matches.literals("A", "B").rename("enumTest");
    const input = "bad";
    const output = enumTest.parse(input, unFold);
    assertSnapshot(
      `"Named<\\"enumTest\\",Literal<\\"A\\",\\"B\\">>(\\"bad\\")"`,
      output,
    );
  });
});
