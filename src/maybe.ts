import { MonadUnion } from "./monad";

type nill = null | void | undefined;
export class Maybe<A> extends MonadUnion<{ none: ""; some: A }, "some"> {
  static none = MonadUnion.of("some", "none", "") as Maybe<any>;
  static some = <A>(value: A | nill) =>
    value == null ? (Maybe.none as Maybe<A>) : (MonadUnion.of("some", "some", value) as Maybe<A>);
}

export const Some = {
  of: Maybe.some
};

export const None = {
  of: Maybe.none,
  ofFn: () => Maybe.none
};
