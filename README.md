# API Testing Suite

[![API Tests](https://github.com/mc-solo/api-testing-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/mc-solo/api-testing-suite/actions/workflows/ci.yml)

API testing practice and proof of work by **Wondwosen Asegid, SDET**.

A clean, focused suite for a junior / mid level SDET role: REST, GraphQL and
gRPC contract testing, plus k6 performance tests, all wired into CI that runs
on every push and once a day. The goal is strong fundamentals done well:
clear test names, schema validation, negative cases, and honest reporting of
what passed and what did not.

> No work or client system is tested here. The REST and GraphQL targets are
> public demo APIs, and the gRPC service is a small local sample service
> included in this repo for contract testing only.

## What it tests

| Area | Target | Tests |
| --- | --- | --- |
| REST | https://jsonplaceholder.typicode.com | 26 |
| GraphQL | https://countries.trevorblades.com | 14 |
| gRPC | Local sample `UserService` (in this repo) | 14 |
| k6 performance | JSONPlaceholder (light load) | 2 scripts |
| **Total** | | **54 tests + 2 k6 scripts** |

Test counts were verified by running the suite locally on 2026-11-13.
See [Verification](#verification) below.

### REST (26 tests)

- CRUD on `/posts`: create (201), read, full replace (PUT), partial update (PATCH), delete
- Schema validation with Zod for posts, users, comments, todos and albums
- Query filters (`?userId=1`, `?postId=1`), nested resources (`/posts/1/comments`)
- Response time check (under 2 seconds) and `Content-Type: application/json`
- Negative cases: unknown route (404), missing post, non-numeric id, empty POST body, invalid filter value
- Auth cases: this public API needs no token, so the tests check that an unauthenticated request succeeds and a bogus Bearer token does not change the response

### GraphQL (14 tests)

- Queries by code, with and without variables (`ET` Ethiopia, `US`, `GB`)
- Field-level validation: capital, currency, continent and languages
- Filtered list queries (African countries only) and list queries for continents and languages
- Error cases: malformed query, unknown field, missing required variable, wrong variable type, empty query, unknown country code (returns `null`, not an error)

### gRPC contract tests (14 tests)

The gRPC service is a **local sample service for contract testing, not a real
backend**. It is defined in `proto/user.proto` and implemented in
`src/grpc/server.ts` with an in-memory store. Tests start it on a random local
port, so nothing external is needed.

- `GetUser` / `CreateUser` / `ListUsers`, including fetching a user just created
- Validation: empty or whitespace-only name, invalid or missing email, negative limit
- Error codes: `NOT_FOUND` (5) for a missing user, `INVALID_ARGUMENT` (3) for bad input, `UNIMPLEMENTED` (12) for an unknown method

### k6 performance (2 scripts)

- `k6/load-test.js`: 10 virtual users for 30s; thresholds p95 < 800 ms, error rate < 5%
- `k6/stress-test.js`: ramps 10 -> 25 -> 50 VUs; thresholds p95 < 1500 ms, error rate < 10%
- Kept light on purpose: JSONPlaceholder is a shared public demo API

## Project structure

```text
api-testing-suite/
  proto/user.proto            # gRPC contract for the local sample service
  src/
    config.ts                 # base URLs (overridable with env vars)
    clients/restClient.ts     # axios client for JSONPlaceholder
    clients/graphqlClient.ts  # small GraphQL POST helper
    schemas/                  # Zod schemas for REST and GraphQL responses
    grpc/server.ts            # local sample UserService (in-memory)
    grpc/client.ts            # gRPC client helper for tests
  tests/
    rest/                     # posts, users/comments, negative + auth cases
    graphql/countries.test.ts
    grpc/userService.test.ts  # starts the local server per run
  k6/
    load-test.js
    stress-test.js
    README.md                 # how to install and run k6
  .github/workflows/ci.yml    # push + daily 06:00 UTC, includes k6
```

## How to run

```bash
npm install
```

| Command | What it runs |
| --- | --- |
| `npm test` | All suites (REST + GraphQL + gRPC) |
| `npm run test:rest` | REST suite only |
| `npm run test:graphql` | GraphQL suite only |
| `npm run test:grpc` | gRPC contract suite only |
| `npm run typecheck` | TypeScript typecheck |
| `npm run k6:load` | k6 load test (needs k6 installed) |
| `npm run k6:stress` | k6 stress test (needs k6 installed) |

Environment overrides:

```bash
REST_BASE_URL=https://jsonplaceholder.typicode.com npm run test:rest
GRAPHQL_URL=https://countries.trevorblades.com npm run test:graphql
```

k6 install: see `k6/README.md`.

## CI

`.github/workflows/ci.yml` runs on push to `main`, on pull requests, on a
daily schedule (`0 6 * * *` UTC), and on manual dispatch. It runs typecheck,
the REST, GraphQL and gRPC suites, and the k6 load test in a second job.

## Tech

TypeScript, Vitest, Axios, Zod, `@grpc/grpc-js` + `@grpc/proto-loader`, k6,
GitHub Actions.

## Verification

Verified locally on 2026-11-13 (Node v24.22.1, npm 10.9.4):

- REST: 26 tests, all passing
- GraphQL: 14 tests, all passing
- gRPC: 14 tests, all passing
- **Total: 54 tests, 54 passed, 0 failed**
- k6 load test: ran locally with k6 v0.57.0, all thresholds passed:
  207 iterations, 621 requests, 828/828 checks (100%), p95 238.72 ms,
  0.00% failed requests. The stress script was syntax-checked only and
  has not been run end to end yet.

## Notes for reviewers

- JSONPlaceholder is a fake API: POST/PUT/PATCH return the expected status
  and echo the payload, but nothing is persisted. The tests assert on that
  documented behaviour and do not assume persistence.
- The countries GraphQL API is a public demo; its data is read-only.
- The gRPC service is local only and holds users in memory for the test run.
