import { Either, Left, Right } from "./either";

describe("either", () => {
  describe("left(4)", () => {
    const given = Left.of(4);
    it("should be able to default to a value", () => {
      const answer = { hi: "there" };
      expect(given.defaultTo(answer)).toBe(answer);
    });
    it("map over function 2x", () => {
      expect(given.map(x => 2 * x).value).toBe(4);
    });
    it("chain over function right 2x", () => {
      expect(given.chain(x => Right.of(2 * x)).value).toBe(4);
    });
    it("chain over function left 3x", () => {
      expect(given.chain(x => Left.of(3 * x)).value).toBe(4);
    });
    it("chain left over function left 4x", () => {
      expect(given.chainLeft(x => Left.of(4 * x)).value).toBe(16);
    });
    it("chain left over function right 4x", () => {
      expect(given.chainLeft(x => Right.of(4 * x)).value).toBe(16);
    });

  });
  describe("right(5)", () => {
    const given = Right.of(5);
    it("should be able to default to a value", () => {
      const defaultValue = 6;
      expect(given.defaultTo(defaultValue)).toBe(5);
    });
    it("map will work over function  2x", () => {
      expect(given.map(x => 2 * x).value).toBe(10);
    });
    it("chain over function right 3x", () => {
      expect(given.chain(x => Right.of(3 * x)).value).toBe(15);
    });
    it("chain over function left 3x", () => {
      expect(given.chain(x => Left.of(3 * x)).value).toBe(15);
    });
    it("chain left over function left 4x", () => {
      expect(given.chainLeft(x => Left.of(4 * x)).value).toBe(5);
    });
    it("chain left over function right 4x", () => {
      expect(given.chainLeft(x => Right.of(4 * x)).value).toBe(5);
    });
  });
});
