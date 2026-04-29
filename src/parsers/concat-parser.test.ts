import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("ConcatParsers", () => {
  test("should combine two parsers and validate", () => {
    const testValue = 4;
    const isEven = matches.number.refine(
      (num: number): num is number => num % 2 === 0,
      "isEven",
    );
    expect(isEven.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should combine two parsers and reject invalid", () => {
    const testValue = 5;
    const isEven = matches.number.refine(
      (num: number): num is number => num % 2 === 0,
      "isEven",
    );
    assertSnapshot('"isEven(5)"', isEven.parse(testValue, unFold));
  });

  test("should refine and validate correct value", () => {
    const testValue = 4;
    const isEven = matches.number.refine((num): num is number => {
      const _test: number = num;
      return num % 2 === 0;
    }, "isEven");
    expect(isEven.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should reject invalid value with refine", () => {
    const testValue = 5;
    const isEven = matches.number.refine(
      (num: number): num is number => num % 2 === 0,
      "isEven",
    );
    assertSnapshot('"isEven(5)"', isEven.parse(testValue, unFold));
  });

  test("should clean up anys in refine chain", () => {
    const testValue = 5;
    const isEven = matches.any.refine(
      (num: any): num is number => num % 2 === 0,
      "isEven",
    );
    try {
      isEven.unsafeCast(testValue);
    } catch (e: any) {
      assertSnapshot('"Failed type: isEven(5) given input 5"', e.message);
    }
  });

  test("should validate with .validate()", () => {
    const testValue = 4;
    const isEven = matches.number.validate((num) => {
      const _test: number = num;
      return num % 2 === 0;
    }, "isEven");
    expect(isEven.parse(testValue, unFold)).toEqual(testValue);
  });

  test("should check that valid values pass refine", () => {
    const testValue = 4;
    const isEven = matches.number.refine(
      (num: number): num is number => num % 2 === 0,
      "isEven",
    );
    assertSnapshot('"parsed(4)"', isEven.parse(testValue, {
      invalid: Parser.validatorErrorAsString,
      parsed: (x: any): any => `parsed(${x})`,
    }));
  });
});
