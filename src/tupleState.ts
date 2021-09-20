import { ISimpleParsedError } from "./parsers/interfaces";

export type TupleStateValid<A> = readonly ["valid", A];
export type TupleStateInvalid = readonly ["invalid", ISimpleParsedError];

export type TupleState<A> = TupleStateValid<A> | TupleStateInvalid;

export function tupleStateIsInvalid<A>(
  state: TupleState<A>
): state is TupleStateInvalid {
  return state[0] === "invalid";
}

export function tupleStateValidValue<A>([, value]: TupleStateValid<A>): A {
  return value;
}
export function tupleStateInvalidValue([
  ,
  value,
]: TupleStateInvalid): ISimpleParsedError {
  return value;
}
