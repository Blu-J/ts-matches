// ex. scripts/build_npm.ts
import { build } from "https://deno.land/x/dnt@0.25.3/mod";

await build();

// post build steps
Deno.copyFileSync("./README.md", "lib/README.md");
