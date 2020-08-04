export type DisjoinUnionRaw<A, Key extends keyof A> = Key extends string
  ? { type: Key; value: A[Key] }
  : never;
export type DisjoinUnion<A> = DisjoinUnionRaw<A, keyof A>;
export type DisjoinUnionTypes<A> = DisjoinUnion<A>["type"] & keyof A;
export class MonadUnion<A extends {}, DefaultKey extends DisjoinUnionTypes<A>> {
  static of<
    A extends {},
    Key extends DisjoinUnionTypes<A>,
    DefaultKey extends DisjoinUnionTypes<A>
  >(defaultKey: DefaultKey, key: Key, value: A[Key]) {
    const monadValue = ({
      type: key,
      value,
    } as unknown) as DisjoinUnion<A>;
    return new MonadUnion<A, DefaultKey>(defaultKey, monadValue);
  }
  protected constructor(
    private readonly defaultKey: DefaultKey,
    readonly value: DisjoinUnion<A>
  ) {}

  fold<B>(folder: { [Key in keyof A]: (value: A[Key]) => B }) {
    return (folder as any)[this.value.type](this.value.value);
  }

  chain<B, Key extends keyof A = DefaultKey>(
    fn: (
      value: A[Key]
    ) => MonadUnion<
      { [key in keyof A]: key extends Key ? B : A[key] },
      DefaultKey
    >,
    key: Key = this.defaultKey as any
  ): MonadUnion<
    { [key in keyof A]: key extends Key ? B : A[key] },
    DefaultKey
  > {
    if (key === this.value.type) {
      return fn(this.value.value as A[Key]);
    }
    return this as any;
  }

  map<B, Key extends keyof A = DefaultKey>(
    fn: (value: A[Key]) => B,
    key: Key = this.defaultKey as any
  ): MonadUnion<
    { [key in keyof A]: key extends Key ? B : A[key] },
    DefaultKey
  > {
    if (key === this.value.type) {
      return MonadUnion.of<
        { [key in keyof A]: key extends Key ? B : A[key] },
        any,
        DefaultKey
      >(this.defaultKey, key, fn(this.value.value as A[Key]) as any) as any;
    }
    return this as any;
  }

  defaultTo(defaultValue: A[DefaultKey]): A[DefaultKey];
  defaultTo<Key extends keyof A>(defaultValue: A[Key], key: Key): A[Key];
  defaultTo<Key extends keyof A>(
    defaultValue: A[Key],
    key = this.defaultKey
  ): A[Key] {
    if (key === this.value.type) {
      return this.value.value as A[Key];
    }
    return defaultValue;
  }

  defaultLazy(defaultValue: () => A[DefaultKey]): A[DefaultKey];
  defaultLazy<Key extends keyof A>(
    defaultValue: () => A[Key],
    key: Key
  ): A[Key];
  defaultLazy<Key extends keyof A>(
    defaultValue: () => A[Key],
    key = this.defaultKey
  ): A[Key] {
    if (key === this.value.type) {
      return this.value.value as A[Key];
    }
    return defaultValue();
  }

  toString() {
    return `${this.value.type}(${JSON.stringify(this.value.value)})`;
  }
}
