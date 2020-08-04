import { MonadUnion } from "./monad";

export class Either<L, R> extends MonadUnion<{ left: L; right: R }, "right"> {
  static left = <L>(value: L): Either<L, any> =>
    MonadUnion.of("right", "left", value) as Either<L, any>;
  static right = <R>(value: R): Either<any, R> =>
    MonadUnion.of("right", "right", value) as Either<any, R>;
}

export const Right = {
  of: Either.right,
};

export const Left = {
  of: Either.left,
};
