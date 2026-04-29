import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, stringFold } from "../tests/helpers";

describe("GuardParser", () => {
  test("should validate with guard without a name", () => {
    expect(matches.guard((x): x is number => Number(x) > 3).unsafeCast(6)).toBe(
      6,
    );
  });

  test("should reject with guard without a name", () => {
    assertSnapshot(
      '"invalid({\\"value\\":2,\\"keys\\":[],\\"parser\\":{\\"typeName\\":\\"\\",\\"description\\":{\\"name\\":\\"Guard\\",\\"children\\":[],\\"extras\\":[\\"\\"]}}})"',
      matches.guard((x): x is number => Number(x) > 3).parse(2, stringFold),
    );
  });

  test("should validate with named guard", () => {
    const isEven = matches.guard(
      (x: unknown): x is number => typeof x === "number" && x % 2 === 0,
      "isEven",
    );
    expect(isEven.unsafeCast(4)).toBe(4);
  });


});
