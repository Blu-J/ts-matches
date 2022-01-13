// ex. scripts/build_npm.ts
import { build } from "https://deno.land/x/dnt/mod.ts";

await build({
  entryPoints: ["./src/matches.ts"],
  outDir: "./lib",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "ts-matches",
    version: Deno.args[0],
    description:
      "We want to bring in some pattern matching into the typescript land. We want to be able to type guard a whole bunch of conditions and get the type back.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/blu-j/ts-matches.git",
    },
    bugs: {
      url: "https://github.com/blu-j/ts-matches/issues",
    },
  },
});

// post build steps
// Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("./README.md", "lib/README.md");
