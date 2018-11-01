export abstract class Maybe<A> {
  abstract fold<Co>(options: { some(a: A): Co; none(): Co }): Co;
  abstract readonly value: A | null;

  defaultTo(defaultValue: A): A {
    return this.fold({
      none: () => defaultValue,
      some: x => x
    });
  }
  map<A2>(mapFn: (r: A) => A2): Maybe<A2> {
    return this.fold({
      none: () => this as any,
      some: a => Some.of(mapFn(a))
    });
  }
  chain<A2>(mapFn: (r: A) => Maybe<A2>): Maybe<A2> {
    return this.fold({
      none: () => this as any,
      some: a => mapFn(a)
    });
  }
}
export class None extends Maybe<any> {
  readonly value = null;
  static of = new None();
  static ofFn() {
    return None.of;
  }
  fold<Co>(options: { some(a: any): Co; none(): Co }): Co {
    return options.none();
  }
  toString() {
    return `none`;
  }
}
export class Some<A> extends Maybe<A> {
  static of<A>(value: A | null | undefined) {
    if (value == null) {
      return None.of;
    }
    return new Some(value);
  }
  constructor(readonly value: A) {
    super();
  }
  fold<Co>(options: { some(a: A): Co; none(): Co }): Co {
    return options.some(this.value);
  }
  toString() {
    return `some(${this.value})`;
  }
}
