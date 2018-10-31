export abstract class Either<L, R> {
  abstract fold<Co>(options: { left(l: L): Co; right(r: R): Co }): Co;
  abstract readonly value: L | R;

  map<R2>(mapFn: (r: R) => R2): Either<L, R2> {
    return this.chain(x => Right.of(mapFn(x)));
  }
  chain<R2>(mapFn: (r: R) => Either<L, R2>): Either<L, R2> {
    return this.fold({
      left: l => this as any,
      right: r => mapFn(r)
    });
  }
}
export class Right<L, R> extends Either<L, R> {
  static of<R>(value: R) {
    return new Right<any, R>(value);
  }
  constructor(readonly value: R) {
    super();
  }
  fold<Co>(options: { left(l: L): Co; right(r: R): Co }): Co {
    return options.right(this.value);
  }
  toString() {
    return `right(${(this.value)})`;
  }
}
export class Left<L, R> extends Either<L, R> {
  static of<L>(value: L) {
    return new Left<L, any>(value);
  }
  constructor(readonly value: L) {
    super();
  }
  fold<Co>(options: { left(l: L): Co; right(r: R): Co }): Co {
    return options.left(this.value);
  }
  toString() {
    return `left(${(this.value)})`;
  }
}
