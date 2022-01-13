version = $(shell cat ./VERSION)
bundle: test
	echo $(version)
	deno run --allow-write --allow-env --allow-run --allow-read build.ts $(version)
test:
	deno test --allow-write --allow-read --unstable src/tests.ts

publish: bundle
	cd lib
	npm publish

human_coverage:
	deno test --unstable --coverage=coverage src/tests.ts   
	deno --unstable coverage ./coverage --lcov > coverage.lcov
	genhtml -o cov_profile/html coverage.lcov