type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export class MonadUnion<A extends {}, DefaultKey extends keyof A> {
  static of<A extends {}, Key extends keyof A, DefaultKey extends keyof A>(
    defaultKey: DefaultKey,
    key: Key,
    value: A[Key]
  ) {
    return new MonadUnion<A, DefaultKey>(defaultKey, {
      [key]: value
    } as any);
  }
  protected constructor(
    private readonly defaultKey: DefaultKey,
    readonly value: AtLeastOne<A>
  ) {}

  fold<B>(folder: { [Key in keyof A]: (value: A[Key]) => B }) {
    const firstKey: keyof A = Object.keys(this.value)[0] as any;
    return folder[firstKey](this.value[firstKey]);
  }

  chain<
    B extends Omit<A, Key> & { [K in Key]: A[K] } & { [key in keyof A]: any },
    Key extends keyof A = DefaultKey
  >(
    fn: (value: A[Key]) => MonadUnion<B, DefaultKey>,
    key: Key = this.defaultKey as any
  ): MonadUnion<B, DefaultKey> {
    if (key in this.value) {
      return fn(this.value[key]);
    }
    return this as any;
  }

  map<
    B extends Omit<A, Key> & { [K in Key]: A[K] } & { [key in keyof A]: any },
    Key extends keyof A = DefaultKey
  >(
    fn: (value: A[Key]) => B[Key],
    key: Key = this.defaultKey as any
  ): MonadUnion<B, DefaultKey> {
    if (key in this.value) {
      return MonadUnion.of<B, Key, DefaultKey>(
        this.defaultKey,
        key,
        fn(this.value[key])
      );
    }
    return this as any;
  }

  defaultTo(defaultValue: A[DefaultKey]): A[DefaultKey];
  defaultTo<Key extends keyof A>(defaultValue: A[Key], key: Key): A[Key];
  defaultTo<Key extends keyof A>(
    defaultValue: A[Key],
    key = this.defaultKey
  ): A[Key] {
    if (key in this.value) {
      return this.value[key] as any;
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
    if (key in this.value) {
      return this.value[key] as any;
    }
    return defaultValue();
  }

  toString() {
    const key: keyof A = Object.keys(this.value)[0] as any;
    return `${key}(${this.value[key]})`;
  }
}
