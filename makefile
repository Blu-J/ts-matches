version = $$(git tag --sort=committerdate | tail -1)
bundle: test fmt
	echo $(version)
	deno run --allow-write --allow-env --allow-run --allow-read build.ts $(version)
test: fmt
	deno test --allow-write --allow-read --unstable src/tests.ts
fmt:
	deno fmt

publish: bundle
	cd lib
	npm publish

human_coverage:
	rm -rf coverage || true
	rm -rf cov_profile || true
	rm coverage.lcov || true
	deno test --unstable --coverage=coverage src/tests.ts   
	deno --unstable coverage ./coverage --lcov > coverage.lcov
	genhtml -o cov_profile/html coverage.lcov