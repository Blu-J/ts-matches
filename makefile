bundle:
	deno bundle src/matches.ts lib/matches.js
test:
	deno test --allow-write --allow-read --unstable src/tests.ts