# Typescript Matches
[![CircleCI](https://circleci.com/gh/Blu-J/ts-matches.svg?style=svg)](https://circleci.com/gh/Blu-J/ts-matches)
[![Coverage Status](https://coveralls.io/repos/github/Blu-J/ts-matches/badge.svg?branch=master)](https://coveralls.io/github/Blu-J/ts-matches?branch=master)

## Why

This is useful on a boundary layer, like fetching a value. In that case we have no idea what the shape is, so we should do a check on that.

```typescript
import matches from "matches";
fetch("fishes.com/gold-fishes/12")
  .then(x => x.json())
  .then(
    matches.shape({
      type: t.literal("gold-fish"),
      position: t.tuple([t.number, t.number]),
      age: t.natural,
      name: t.string
    }).unsafeCast
  );
```

And when we get the value out it will either be the type that we want, or it will throw an error. The other use case is a pattern matching.

```typescript
import matches from "matches";
const getText = (x: unknown): string =>
  matches(x)
    .when(matches.string, value => `Found string: ${value}`)
    .when(matches.number, value => `Found number + 1: ${value + 1}`)
    .defaultTo("no found type yet");
```

And here we can use the type checking and what do in that case. With destructuring, lots of abilities are there

```typescript
import matches from "matches";
const matchNone = matches.tuple([matches.literal("none")]);
const matchSome = matches.tuple([matches.literal("some"), matches.any]);
type option =
  | ReturnType<typeof matchNone.unsafeCast>
  | ReturnType<typeof matchSome.unsafeCast>;
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

## How

So to use this, there is the exported default which is a function for the pattern matching which includes other validators on the object.

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

And of of any matcher we two functions, refine and unsafe cast. Refine is useful when we want to check a condition, like is even.
And the matcher is also a function which creates an either of our value as well.

## Deploying
Use the `npm version minor | major` and push the tags up, circle ci should do the publish on the master based on tags
