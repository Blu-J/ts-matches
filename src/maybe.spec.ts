import { Maybe, Some, None } from "./maybe";
const value = {
  some: (x: any): any => x,
  none: (): any => null
};
describe("Maybe", () => {
  describe("None(4)", () => {
    const given: Maybe<number> = None.ofFn();
    it("should have string value none()", () => {
      expect(`${given}`).toEqual("none(\"\")");
    });
    it("should be able to default to a value", () => {
      const answer = 2;
      expect(given.defaultTo(answer)).toBe(answer);
    });
    it("should be able to default to a value", () => {
      const answer = 2;
      expect(given.defaultLazy(() => answer)).toBe(answer);
    });
    it("map over function 2x", () => {
      expect(given.map(x => 2 * x).fold(value)).toBe(null);
    });
    it("chain over function Some 2x", () => {
      expect(given.chain(x => Some.of(2 * x)).fold(value)).toBe(null);
    });
    it("chain over function None 3x", () => {
      expect(given.chain(x => None.of).fold(value)).toBe(null);
    });
  });
  describe("Some(5)", () => {
    const given: Maybe<number> = Some.of(5);
    it("should have string value some(5)", () => {
      expect(`${given}`).toEqual("some(5)");
    });
    it("should be able to default to a value", () => {
      const defaultValue = 6;
      expect(given.defaultTo(defaultValue)).toBe(5);
    });
    it("should be able to default to a value", () => {
      const defaultValue = 6;
      expect(given.defaultLazy(() => defaultValue)).toBe(5);
    });
    it("map will work over function  2x", () => {
      expect(given.map(x => 2 * x).fold(value)).toBe(10);
    });
    it("chain over function Some 3x", () => {
      expect(given.chain(x => Some.of(3 * x)).fold(value)).toBe(15);
    });
    it("chain over function None 3x", () => {
      expect(given.chain(x => None.of).fold(value)).toBe(null);
    });
  });
  describe("Some(undefined)", () => {
    const given: Maybe<number> = Some.of<number>(undefined);
    it("should have string value none()", () => {
      expect(`${given}`).toEqual("none(\"\")");
    });
    it("should be able to default to a value", () => {
      const answer = 4;
      expect(given.defaultTo(answer)).toBe(answer);
    });
    it("map over function 2x", () => {
      expect(given.map(x => 2 * x).fold(value)).toBe(null);
    });
    it("chain over function Some 2x", () => {
      expect(given.chain(x => Some.of(2 * x)).fold(value)).toBe(null);
    });
    it("chain over function None 3x", () => {
      expect(given.chain(x => None.of).fold(value)).toBe(null);
    });
  });
});
