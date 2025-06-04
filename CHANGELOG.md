# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this
project adheres to [Semantic Versioning](http://semver.org/).

## [5.0.0] - 2022-01-13

Making the description type to convert the parser into something else, like
JsonSchema or typescript types. This brings in the names, children, and extras
for each.

Adding in optional transformers to bring in to make things like typescript types

```ts
import matches from "ts-matches";
import parserAsTypescriptString from "ts-matches/lib/typescriptTypes";
console.log(parserAsTypescriptString(matches.string)); // string
```

Moving several simple parsers into their own description and parsers. Useful for
things like typescript that have primitives like strings, numbers, and booleans.

Changed the tuples to use the style of variadic instead of arrays, needed for
typescript inference.

Feat: Make the build include deno first, then compile to mjs and umd

Feature: Bringing in the recursive types

Feature: Bringing in the deferred types

Feature: Optionals added to the shape function, so we can have one function to
declare optionals

## [4.2.0] - 2021-04-03

Adding in better matching capabilities.

### Added

- More features to the matcher, to be able to match on multiple matchers, and
  literals
- Allow matcher to match on literals or matchers, and plural of them
- Allow when to return a function output or a literal

### Changed

### Fixed

## [4.1.0]

### Added

- Regexes are now real regexes
- Better messages on error again

### Changed

### Fixed

## [4.0.0]

Moved to a parsing instead of validation style. Meaning that the unsafe cast can
do operations on the inputs. Also makes more of the system created with less
dynamic lambdas meaning less hitting of the garbage collector.

### Added

- Dictionary parsers

### Changed

### Fixed

```

```
