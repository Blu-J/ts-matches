import { MonadUnion } from "./monad";

type nill = null | void | undefined;
export class Maybe<A> extends MonadUnion<{ none: ""; some: A }, "some"> {
  static none: Maybe<any> = MonadUnion.of("some", "none", "");
  static some = <A>(value: A | nill): Maybe<A> =>
    value == null ? Maybe.none : MonadUnion.of("some", "some", value);
}

export const Some = {
  of: Maybe.some
};

export const None = {
  of: Maybe.none,
  ofFn: () => Maybe.none
};
