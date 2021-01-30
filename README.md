# Typescript Matches

[![CircleCI](https://circleci.com/gh/Blu-J/ts-matches.svg?style=svg)](https://circleci.com/gh/Blu-J/ts-matches)
[![Coverage Status](https://coveralls.io/repos/github/Blu-J/ts-matches/badge.svg?branch=master)](https://coveralls.io/github/Blu-J/ts-matches?branch=master)
![Bundle Phobia](https://badgen.net/bundlephobia/minzip/ts-matches)
![Bundle Phobia](https://badgen.net/bundlephobia/min/ts-matches)

Living Documentation https://runkit.com/blu-j/ts-matches

# Uses

* Schema Validation (Validators: like matches.string)
* Schema Switching


## Tech Used

[Wiki Pattern Matching](https://en.wikipedia.org/wiki/Pattern_matching)

Uses [Monads](<https://en.wikipedia.org/wiki/Monad_(functional_programming)>) either and maybe under the hood.
Also useful for casting and boundary verifications.

## Examples

This is useful on a boundary layer, like fetching a value. In that case we have no idea what the shape is, so we should do a check on that.

```typescript
import matches from "matches";
fetch("fishes.com/gold-fishes/12")
  .then((x) => x.json())
  .then(
    matches.shape({
      type: t.literal("gold-fish"),
      position: t.tuple([t.number, t.number]),
      age: t.natural,
      name: t.string,
    }).unsafeCast
  );
```

And when we get the value out it will either be the type that we want, or it will throw an error. The other use case is a pattern matching.

```typescript
import matches from "matches";
const getText = (x: unknown): string =>
  matches(x)
    .when(matches.string, (value) => `Found string: ${value}`)
    .when(matches.number, (value) => `Found number + 1: ${value + 1}`)
    .defaultTo("no found type yet");
```

And here we can use the type checking and what do in that case. With destructuring, lots of abilities are there

```typescript
import matches from "matches";
const matchNone = matches.tuple([matches.literal("none")]);
const matchSome = matches.tuple([matches.literal("some"), matches.any]);
type option = ReturnType<typeof matchNone.unsafeCast> | typeof matchSome._TYPE;
const matchInteger = matches.every(
  matchSome,
  matches.tuple[(matches.any, matches.number)]
);
const testValue = ["some", 3];
const currentValue = matches(testValue)
  .when(matchNone, () => 0)
  .when(matchInteger, ([, value]) => value + 1)
  .when(matchSome, () => 0)
  .defaultTo(0);
```

## API

Given that the default export is `matches`
Then the type of `matches` is `unkown -> matcherChain`, and also has the properties
on that function that return a `validator` or a function that creates a `validator`

| Attribute  | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| array      | Testing that any array is good                                |
| arrayOf    | Testing that any array is good and filled with type passed in |
| some       | That one of the matchers pass                                 |
| tuple      | That we match a tuple of validators                           |
| regex      | That we are a regex                                           |
| number     | Number                                                        |
| natural    | Number > 0 and is integer                                     |
| isFunction | is a function                                                 |
| object     | is an object                                                  |
| string     | is a string                                                   |
| shape      | Matches a shape of an object                                  |
| partial    | Matches a shape of maybe attributes                           |
| literal    | Matches an exact match                                        |
| every      | Matches every match passed in                                 |
| guard      | Custom function for testing                                   |
| any        | is something                                                  |
| boolean    | is a boolean                                                  |
| nill       | is a null or undefined                                        |

`MatcherChain` api

| Attribute     | Description                                               |
| ------------- | --------------------------------------------------------- |
| match         | Create a matching case, when match return value           |
| defaultTo     | Fall through case, ensures all are caught                 |
| defaultToLazy | Fall through case, ensures all are caught in lazy fashion |

`Parser` api

| Attribute   | Description                                          |
| ----------- | ---------------------------------------------------- |
| parse       | Use this to turn a value into an either              |
| usafeCast   | Use this to get the value or throw an error          |
| castPromise | Cast into a promise                                  |
| optional    | output type is now a null of value                   |
| defaultTo   | instead of creating a optional we fallback to a value |
| refine      | we want to add more tests to value                   |

`Validator.validatorErrorAsString` (
    validationError: ValidatorError
  ): string
 This is the exposed transform of the ValidatorError to a string. Override this if you want to make the errors different.


And of of any matcher we two functions, refine and unsafe cast. Refine is useful when we want to check a condition, like is even.
And the matcher is also a function which creates an either of our value as well.

## Deploying

Use the `npm version minor | major` and push the tags up, circle ci should do the publish on the master based on tags
