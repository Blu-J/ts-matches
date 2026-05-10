import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("DeferredParser", () => {
  test("should handle deferred shape correctly", () => {
    type Things = string | [OtherThings];
    type OtherThings = { type: "other"; value: Things };
    const [matchThings, setMatchThings] = matches.deferred<Things>();
    const matchOtherThings = matches.shape({
      type: matches.literal("other"),
      value: matchThings,
    });
    setMatchThings(matches.some(matches.string, matches.tuple(matchOtherThings)));

    const testValue = [
      { type: "other", value: [{ type: "other", value: "test" }] },
    ];
    const parsed = matchThings.unsafeCast(testValue);
    expect(parsed).toEqual(testValue);
  });

  test("should reject invalid deferred shape", () => {
    type Things = string | [OtherThings];
    type OtherThings = { type: "other"; value: Things };
    const [matchThings, setMatchThings] = matches.deferred<Things>();
    const matchOtherThings = matches.shape({
      type: matches.literal("other"),
      value: matchThings,
    });
    setMatchThings(matches.some(matches.string, matches.tuple(matchOtherThings)));

    const testValue = [
      { type: "other", value: [{ type: "ot2her", value: "test" }] },
    ];

    try {
      matchThings.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"[\\"0\\"][\\"value\\"][\\"0\\"][\\"type\\"]Or<Tuple<Shape<{type:Literal<\\\"other\\\">,value:Deferred<>}>>,string>(\\"ot2her\\")"',
        matchThings.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });

  test("should reject when deferred is not set up", () => {
    type Things = string | [OtherThings];
    type OtherThings = { type: "other"; value: Things };
    const [matchThings] = matches.deferred<Things>();
    const testValue = [
      { type: "other", value: [{ type: "ot2her", value: "test" }] },
    ];

    try {
      matchThings.unsafeCast(testValue);
    } catch (_e) {
      assertSnapshot(
        '"Deferred<>(\\"Not Set Up\\")"',
        matchThings.parse(testValue, unFold),
      );
      return;
    }
    throw new Error("should be invalid");
  });
});
