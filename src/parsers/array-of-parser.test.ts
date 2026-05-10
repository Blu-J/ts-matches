import { test, expect } from "@jest/globals";
import matches from "../matches";
import { isType } from "../tests/helpers";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("ArrayOfParser", () => {
  test("should validate an array of matching elements", () => {
    const testValue = [5, 5, 5];
    const arrayOf = matches.arrayOf(matches.literal(5));
    expect(arrayOf.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject a non-array value", () => {
    const testValue = "bad";
    const arrayOf = matches.arrayOf(matches.literal(5));
    assertSnapshot(
      '"ArrayOf<Literal<5>>(\\"bad\\")"',
      arrayOf.parse(testValue, unFold),
    );
  });

  test("should reject an array with non-matching element", () => {
    const testValue = [5, 3, 2, 5, 5];
    const arrayOf = matches.arrayOf(matches.literal(5));
    assertSnapshot('"[1]Literal<5>(3)"', arrayOf.parse(testValue, unFold));
  });

  test("should infer correct type from arrayOf", () => {
    const testValue = [{ test: 5 }];
    const matchTest = matches.shape({ test: matches.number });
    type Test = typeof matchTest._TYPE;
    const arrayOf = matches.arrayOf(matchTest);
    const testValuesGood: Test = arrayOf.unsafeCast(testValue)[0];
    expect(testValuesGood).toEqual(testValue[0]);
    isType<Test>(testValuesGood);
  });

  test("should infer correct type from array(shape)", () => {
    const testValue = [{ test: 5 }];
    const matchTest = matches.object({ test: matches.number });
    type Test = typeof matchTest._TYPE;
    const arrayOf = matches.array(matchTest);
    const testValuesGood: Test = arrayOf.unsafeCast(testValue)[0];
    expect(testValuesGood).toEqual(testValue[0]);
    isType<Test>(testValuesGood);
  });
});
