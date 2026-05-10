# ts-matches API Documentation

Generated API documentation for the ts-matches library.

## Viewing the Docs

Open `docs/api/index.html` in a browser to view the full API documentation.

## Regenerating the Docs

```bash
npx typedoc --tsconfig tsconfig.json
```

Or using the npm script (if configured):

```bash
npm run docs
```

## Theme

The default TypeDoc theme is used, which includes:
- Light and dark mode toggle (bottom-left of the page)
- Responsive navigation sidebar
- Full-text search
- Typed member hierarchy

## Contents

The generated docs include:

- **Classes** — All parser classes (AnyParser, ShapeParser, StringParser, etc.)
- **Interfaces** — ChainMatches, IParser, and other interfaces
- **Type Aliases** — All public type aliases (Fn, ValidatorError, etc.)
- **Functions** — All parser factory functions (shape, tuple, arrayOf, etc.)
- **Variables** — All exported constants and the main `matches` export

## Notes

- Docs are generated from JSDoc comments in the source code
- If a parser or function is missing documentation, add JSDoc to the source file and regenerate
- The `typedoc.json` config file controls generation settings
