# Typescript Matches

[![codecov](https://codecov.io/gh/Blu-J/ts-matches/branch/master/graph/badge.svg?token=RQ37H4AWWR)](https://codecov.io/gh/Blu-J/ts-matches)
![Bundle Phobia](https://badgen.net/bundlephobia/minzip/ts-matches)
![Bundle Phobia](https://badgen.net/bundlephobia/min/ts-matches)

Living Documentation https://runkit.com/blu-j/ts-matches

# Uses

- Schema Validation (parsers: like matches.string)
- Schema Switching
- Pattern matching
- Switches as expressions

# Related Libs

- https://github.com/Blu-J/ts-matches-json-schema/ A library to be able to
  serialize + deserialize the types from json schema <-> ts-matches

## Tech Used

[Wiki Pattern Matching](https://en.wikipedia.org/wiki/Pattern_matching)

Also useful for casting and boundary verifications. So using this as a json
validator. The benefit comes that the parser becomes a validator, also the types
are given back to typescript, where something like ajv cannot do or alot of
validators.

## Examples

The easiest and most useful feature is using the matcher as a validation. Here I
want to validate that the shape is correct or throw an error

```typescript
import matches from "https://deno.land/x/ts_matches/mod";
// could also use matches.shape here as well
const goldFishMatcher = matches.object({
  type: t.literal("gold-fish"),
  position: t.tuple(t.number, t.number),
  age: t.natural,
  name: t.string,
});
// For this example I'm making the shape less known
const input: object = {
  type: "gold-fish",
  position: [2, 3],
  age: 5,
  name: "Nemo",
};
// The matcher will know that the type returned is always the correct shape, and the type will reflect that
const checkedInput = goldFishMatcher.unsafeCast(input);
```

A variation is to use the guard version.

```typescript
import matches from "ts-matches";
const goldFishMatcher = matches.object({
  type: t.literal("gold-fish"),
  position: t.tuple(t.number, t.number),
  age: t.natural,
  name: t.string,
});
// For this example I'm making the shape less known
const input: object = {
  type: "gold-fish",
  position: [2, 3],
  age: 5,
  name: "Nemo",
};
if (!goldFishMatcher.test(input)) {
  return;
}
/// After this point typescript will know the shape will be intersecting the shape we defined in the matcher
```

This is useful on a boundary layer, like fetching a value. In that case we have
no idea what the shape is, so we should do a check on that.

```typescript
import matches from "https://deno.land/x/ts_matches/mod";
fetch("fishes.com/gold-fishes/12")
  .then((x) => x.json())
  .then(
    matches.object({
      type: t.literal("gold-fish"),
      position: t.tuple(t.number, t.number),
      age: t.natural,
      name: t.string,
    }).unsafeCast,
  );
```

And when we get the value out it will either be the type that we want, or it
will throw an error. The other use case is a pattern matching.

```typescript
import matches from "matches";
const getText = (x: unknown): string =>
  matches(x)
    .when(matches.string, (value) => `Found string: ${value}`)
    .when(matches.number, (value) => `Found number + 1: ${value + 1}`)
    .defaultTo("no found type yet");
```

And here we can use the type checking and what do in that case. With
destructuring, lots of abilities are there

```typescript
import matches from "matches";
const matchNone = matches.tuple(matches.literal("none"));
const matchSome = matches.tuple(matches.literal("some"), matches.any);
type option = ReturnType<typeof matchNone.unsafeCast> | typeof matchSome._TYPE;
const matchInteger = matches.every(
  matchSome,
  matches.tuple(matches.any, matches.number),
);
const testValue = ["some", 3];
const currentValue = matches(testValue)
  .when(matchNone, () => 0)
  .when(matchInteger, ([, value]) => value + 1)
  .when(matchSome, () => 0)
  .defaultTo(0);
```

We can also use the matches to match on literals, or return literals

```typescript
import matches from "matches";
const currentValue = matches("5" as const)
  .when("5", "6", "At 5 or 6")
  .unwrap(0);
```

## API

Given that the default export is `matches` Then the type of `matches` is
`unkown -> matcherChain`, and also has the properties on that function that
return a `parser` or a function that creates a `parser`

| Attribute  | Description                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| array      | A parser of Parser<\_, unknown[]> or @see arrayOf                                                                                     |
| arrayOf    | Testing that any array is good and filled with type passed in                                                                         |
| some       | That one of the matchers pass                                                                                                         |
| tuple      | That we match a tuple of parsers                                                                                                      |
| regex      | That we match the passed in regex                                                                                                     |
| number     | Number                                                                                                                                |
| natural    | Number > 0 and is integer                                                                                                             |
| isFunction | is a function                                                                                                                         |
| object     | is an object paser (Parser<\_, object>) or @see shape                                                                                 |
| string     | is a string                                                                                                                           |
| shape      | Matches a shape of an object, `shape({key: parser})` for optionals use .optional() and fallback use .defaultTo()                      |
| partial    | Matches a shape of maybe attributes                                                                                                   |
| literal    | Matches an exact match                                                                                                                |
| every      | Matches every match passed in                                                                                                         |
| guard      | Custom function for testing                                                                                                           |
| any        | is something                                                                                                                          |
| boolean    | is a boolean                                                                                                                          |
| nill       | is a null or undefined                                                                                                                |
| dictionary | sets of [parserForKey, parserForValue] to validate a dictionary/ mapped type                                                          |
| recursive  | A way of doing a recursive parser, passing the self. Note this requires the type before while creating, cannot go from creation side. |
| deferred   | A way of creating a type that we will be filling in later, will be using the typescript shape first to verify                         |
| literals   | One the literals passed through                                                                                                       |

`MatcherChain` api

| Attribute     | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| when          | Create a matching case, when match return value                             |
| defaultTo     | Fall through case, ensures all are caught                                   |
| defaultToLazy | Fall through case, ensures all are caught in lazy fashion                   |
| unwrap        | This assumes that all cases are matched (TS tries to throw errors for this) |

`Parser` api

| Attribute    | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| parse        | Use this to turn a value into an either                                |
| unsafeCast   | Use this to get the value or throw an error                            |
| castPromise  | Cast into a promise                                                    |
| optional     | output type can now be null or undefined                               |
| nullable     | output type can now be null                                            |
| defaultTo    | instead of creating a optional we fallback to a value                  |
| onMismatch   | On a error of previous parsing fall back to value passed               |
| withMismatch | On a error of previous parsing fall back to value fn passed            |
| refine       | we want to add more tests to value, could change type to sub           |
| validate     | we want to add more tests to value                                     |
| errorMessage | If validation would create an error, return error as string, else void |
| test         | A guard for the type, returns true if type is valid (as a `x is type`) |
| rename       | Set to a new name for the parser                                       |

`Parser.parserErrorAsString` ( validationError: parserError ): string This is
the exposed transform of the parserError to a string. Override this if you want
to make the errors different.

And of of any matcher we two functions, refine and unsafe cast. Refine is useful
when we want to check a condition, like is even. And the matcher is also a
function which creates an either of our value as well.

## Deploying

Use the `npm version minor | major` and push the tags up, Then publish via npm
