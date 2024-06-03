# Validation

First we will need to import our library.

<!--
  /// Pulling in the library, normally you could pull from
  import matches from "https://deno.land/x/ts_matches/src/matches";

  /// The rest is for testing documentation
  import { assert, assertEquals } from "https://deno.land/std@0.133.0/testing/asserts";
  function assertThrow(fn: Function, expectedMessage: string, testMessage = `but ${fn.name} did not throw`) {
    try {
      fn();
      throw new Error(testMessage);
    } catch (e) {
      assertEquals(e.message, expectedMessage);
    }
  }

-->

The easiest and most useful feature is using the matcher as a validation. Here I
want to validate that the shape is correct or throw an error.

```ts
{
  const { literal, tuple, natural, number, string, shape } = matches;
  const goldFishMatcher = shape({
    type: literal("gold-fish"),
    position: tuple(number, number),
    age: natural,
    name: string,
  });
  type GoldFish = typeof goldFishMatcher._TYPE;
  const invalid_gold_fish: object = {
    type: "god-fish",
    position: [2, 3],
    age: 5,
    name: "Nemo",
  };
  // For this example I'm making the shape less known
  const valid_gold_fish: object = {
    type: "gold-fish",
    position: [2, 3],
    age: 5,
    name: "Nemo",
  };
  // The matcher will know that the type returned is always the correct shape, and the type will reflect that
  let checkedInput = goldFishMatcher.unsafeCast(valid_gold_fish);

  // Though it will give an error message on failure
  assertThrow(
    () => goldFishMatcher.unsafeCast(invalid_gold_fish),
    'Failed type: ["type"]Literal<"gold-fish">("god-fish") given input {"type":"god-fish","position":[2,3],"age":5,"name":"Nemo"}'
  );
}
```

and the

A variation is to use the guard version.

```ts
{
  if (!goldFishMatcher.test(valid_gold_fish)) {
    throw new Error(
      "You could return from a function, break, or throw an error"
    );
  }
  {
    // And the valid type is known after
    let input: GoldFish = valid_gold_fish;
  }

  assertEquals(goldFishMatcher.test(valid_gold_fish), true);
  assertEquals(goldFishMatcher.test(invalid_gold_fish), false);
}
```
