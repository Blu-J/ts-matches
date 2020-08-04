import { Either, Left, Right } from "./either";

const value = {
  left: (x: any): any => x,
  right: (x: any): any => x,
};
describe("either", () => {
  describe("left(4)", () => {
    const given = Left.of(4);
    it("should equal string left(4)", () => {
      expect(`${given}`).toEqual("left(4)");
    });
    it("should be able to default to a value", () => {
      const answer = { hi: "there" };
      expect(given.defaultTo(answer)).toBe(answer);
    });
    it("map over function 2x", () => {
      expect(given.map((x) => 2 * x).fold(value)).toBe(4);
    });
    it("chain over function right 2x", () => {
      expect(given.chain((x) => Right.of(2 * x)).fold(value)).toBe(4);
    });
    it("chain over function left 3x", () => {
      expect(given.chain((x) => Left.of(3 * x)).fold(value)).toBe(4);
    });
    it("chain left over function left 4x", () => {
      expect(given.chain((x) => Left.of(4 * x), "left").fold(value)).toBe(16);
    });
    it("chain left over function right 4x", () => {
      expect(given.chain((x) => Right.of(4 * x), "left").fold(value)).toBe(16);
    });
  });
  describe("right(5)", () => {
    const given = Right.of(5);
    it("should equal string right(5)", () => {
      expect(`${given}`).toEqual("right(5)");
    });
    it("should be able to default to a value", () => {
      const defaultValue = 6;
      expect(given.defaultTo(defaultValue)).toBe(5);
    });
    it("map will work over function  2x", () => {
      expect(given.map((x) => 2 * x).fold(value)).toBe(10);
    });
    it("chain over function right 3x", () => {
      expect(given.chain((x) => Right.of(3 * x)).fold(value)).toBe(15);
    });
    it("chain over function left 3x", () => {
      expect(given.chain((x) => Left.of(3 * x)).fold(value)).toBe(15);
    });
    it("chain left over function left 4x", () => {
      expect(given.chain((x) => Left.of(4 * x), "left").fold(value)).toBe(5);
    });
    it("chain left over function right 4x", () => {
      expect(given.chain((x) => Right.of(4 * x), "left").fold(value)).toBe(5);
    });
  });
});
