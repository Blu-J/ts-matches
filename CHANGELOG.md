# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [5.0.0] - ??.??.??

Making the description type to convert the parser into something else, like JsonSchema or typescript types. This brings in the names, children, and extras for each.

## [4.2.0] - 2021-04-03

Adding in better matching capabilities.

### Added

- More features to the matcher, to be able to match on multiple matchers, and literals
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
do operations on the inputs. Also makes more of the system created with less dynamic
lambdas meaning less hitting of the garbage collector.

### Added

- Dictionary parsers

### Changed

### Fixed
