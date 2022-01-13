version = $(shell cat ./VERSION)
bundle: test
	echo $(version)
	deno run --allow-write --allow-env --allow-run --allow-read build.ts $(version)
test:
	deno test --allow-write --allow-read --unstable src/tests.ts