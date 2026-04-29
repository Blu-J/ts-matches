import { test, expect } from "@jest/globals";
import matches from "../matches";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("RecursiveParser", () => {
  test("should validate simple recursive option", () => {
    type Recursive = number | [Recursive];
    const testValue = [4];
    const validator = matches.recursive<Recursive>((self) =>
      matches.some(matches.number, matches.tuple(self)),
    );
    const parsed = validator.unsafeCast(testValue);
    expect(parsed).toEqual(testValue);
  });

  test("should validate simple recursive shape", () => {
    type Recursive = {
      test: string | Recursive;
    };
    const testValue = { test: { test: "test" } };
    const validator = matches.recursive<Recursive>((self) =>
      matches.shape({ test: matches.some(matches.string, self) }),
    );
    const parsed = validator.unsafeCast(testValue);
    expect(parsed).toEqual(testValue);
  });

  test("should reject invalid recursive shape", () => {
    type Recursive = {
      test: string | Recursive;
    };
    const testValue = [4];
    const validator = matches.recursive<Recursive>((self) =>
      matches.shape({ test: matches.some(matches.string, self) }),
    );
    try {
      validator.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"[\\"test\\"]Shape<{test:Or<Recursive<>,string>}>(\\"missingProperty\\")"',
        validator.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });

  test("should handle recursive invalid state", () => {
    type Recursive = {
      test: string | Recursive;
    };
    const testValue = { test: "test" };
    const validator = matches.recursive<Recursive>((self) =>
      matches.shape({ test: matches.some(matches.string, self) }),
    );
    (validator.parser as any).parser = null;
    try {
      validator.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"Recursive<>(\\"Recursive Invalid State\\")"',
        validator.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });
});
