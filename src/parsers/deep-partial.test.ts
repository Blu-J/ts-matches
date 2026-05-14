import { test, expect } from "@jest/globals";
import { shape } from "./shape-parser";
import { string, number } from "./simple-parsers";

describe("deepPartial", () => {
  let deepPartial: typeof import("./deep-partial").deepPartial;

  beforeEach(async () => {
    const mod = await import("./deep-partial");
    deepPartial = mod.deepPartial;
  });

  test("deepPartial accepts empty object for top-level keys", () => {
    const parser = deepPartial(shape({ name: string, age: number }));
    const result = parser.enumParsed({});
    expect("value" in result).toBe(true);
  });

  test("deepPartial accepts empty object for nested shapes", () => {
    const parser = deepPartial(shape({ addr: shape({ city: string }) }));
    const result = parser.enumParsed({});
    expect("value" in result).toBe(true);
  });

  test("deepPartial accepts partial nested object", () => {
    const parser = deepPartial(shape({
      addr: shape({ city: string, zip: number }),
    }));
    const result = parser.enumParsed({ addr: { city: "NY" } });
    expect("value" in result).toBe(true);
  });

  test("deepPartial rejects invalid values in present keys", () => {
    const parser = deepPartial(shape({ name: string }));
    const result = parser.enumParsed({ name: 42 });
    expect("error" in result).toBe(true);
  });

  test("original parser is unchanged after deepPartial", () => {
    const original = shape({ name: string, age: number });
    deepPartial(original);
    const result = original.enumParsed({});
    expect("error" in result).toBe(true);
  });
});
