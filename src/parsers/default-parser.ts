import { Parser } from "./index";
import { Description, IParser, NonNull, OnParse, Optional } from "./interfaces";

const NAME = "Default";
export class DefaultParser<A, B, B2>
  implements IParser<Optional<A>, NonNull<B, B2>>
{
  static of<A, B, B2>(parent: Parser<A, B>, defaultValue: B2) {
    return new DefaultParser({
      name: NAME,
      children: [parent],
      extras: [defaultValue],
    });
  }
  constructor(
    readonly description: {
      name: typeof NAME;
      children: [Parser<A, B>];
      extras: [B2];
    },
  ) {}

  fromDescription(
    description: Description,
  ): IParser<Optional<A>, NonNull<B, B2>> {
    if (description === this.description) {
      return this;
    }
    if (description.name !== NAME) {
      throw new Error(`The description sent in is invalid type`);
    }

    return new DefaultParser(description as typeof this.description);
  }
  get defaultValue(): B2 {
    return this.description.extras[0];
  }

  get parent(): Parser<A, B> {
    return this.description.children[0];
  }
  parse<C, D>(
    a: A,
    onParse: OnParse<Optional<A>, NonNull<B, B2>, C, D>,
  ): C | D {
    const parser = this;
    const defaultValue = this.defaultValue;
    if (a === undefined) {
      return onParse.parsed(defaultValue as any);
    }
    const parentCheck = this.parent.enumParsed(a);
    if ("error" in parentCheck) {
      parentCheck.error.parser = parser;
      return onParse.invalid(parentCheck.error);
    }
    return onParse.parsed(parentCheck.value as any);
  }
}
