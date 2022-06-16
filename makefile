
lc_md = $(wildcard documentation/*.md)
lc_ts = $(src:.md=.ts)

version = $$(git tag --sort=committerdate | tail -1)
bundle: test fmt
	echo $(version)
	deno run --allow-net --allow-write --allow-env --allow-run --allow-read build.ts $(version)
test: fmt test_living_code
	deno test --allow-write --allow-read --unstable src/tests.ts
	if grep -E "console.log" src/**/*.ts ; then echo 'console.log found'; exit 1; fi
fmt:
	deno fmt

publish: bundle	
	cd lib && npm publish

human_coverage:
	rm -rf coverage || true
	rm -rf cov_profile || true
	rm coverage.lcov || true
	deno test --unstable --coverage=coverage src/tests.ts   
	deno --unstable coverage ./coverage --lcov > coverage.lcov
	genhtml -o cov_profile/html coverage.lcov


test_living_code: documentation/living_code/*.ts make_living_code
	deno test --allow-write --allow-read --unstable $<
make_living_code: documentation/*.md
	{\
		name=$$(echo "$<" | sed "s/documentation\///" | sed "s/\.md//") ;\
		to="documentation/living_code/$$name.ts";\
		echo "Making ts from $< to $$to ";\
		grep '  ' $< | sed -e 's/  //' > $$to ;\
	}