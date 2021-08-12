import { IParser, Optional, NonNull, OnParse } from "./interfaces";

export class DefaultParser<A, B, B2>
  implements IParser<Optional<A>, NonNull<B, B2>> {
  constructor(
    readonly parent: IParser<A, B>,
    readonly defaultValue: B2,
    readonly description = {
      name: "Default" as const,
      children: [parent],
      extras: [defaultValue],
    } as const
  ) {}
  parse<C, D>(
    a: A,
    onParse: OnParse<Optional<A>, NonNull<B, B2>, C, D>
  ): C | D {
    const parser = this;
    const defaultValue = this.defaultValue;
    if (a == null) {
      return onParse.parsed(defaultValue as any);
    }
    return this.parent.parse(a, {
      parsed(value) {
        return onParse.parsed(value as any);
      },
      invalid(error) {
        error.parser = parser;
        return onParse.invalid(error);
      },
    });
  }
}
