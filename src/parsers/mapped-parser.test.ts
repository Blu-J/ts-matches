import { test, expect } from "@jest/globals";
import matches from "../matches";
import { Parser } from "../parsers/index";
import { assertSnapshot, unFold } from "../tests/helpers";

describe("MappedAParser", () => {
  test("should map validation result", () => {
    class Event {
      constructor(readonly type: string) {}
    }
    const testString = "test";
    const event = new Event(testString);
    const isEvent = matches.guard(
      (x: unknown): x is Event => x instanceof Event,
      "isEvent",
    );
    expect(
      isEvent
        .map((x) => {
          const _test: Event = x;
          return x.type;
        })
        .parse(event, unFold),
    ).toBe(testString);
  });

  test("should map validation with named function", () => {
    class Event {
      constructor(readonly type: string) {}
    }
    const testString = "test";
    const event = new Event(testString);
    const isEvent = matches.guard(
      (x: unknown): x is Event => x instanceof Event,
      "isEvent",
    );
    expect(
      isEvent
        .map(function asType(x) {
          return x.type;
        })
        .parse(event, unFold),
    ).toBe(testString);
  });
});
