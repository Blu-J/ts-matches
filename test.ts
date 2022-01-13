import {shape, string} from 'https://deno.land/x/ts_matches/mod.ts'

const verify = shape({hello: string});

verify.unsafeCast({Hello:"world"})