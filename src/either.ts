import { MonadUnion } from "./monad";

export class Either<L, R> extends MonadUnion<{ left: L; right: R }, "right"> {
  static left = <L>(value: L): Either<L, any> =>
    MonadUnion.of("right", "left", value);
  static right = <R>(value: R): Either<any, R> =>
    MonadUnion.of("right", "right", value);
}
