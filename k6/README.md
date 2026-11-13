# k6 performance tests

Light, polite performance checks against JSONPlaceholder, a public demo API.
They are not run against any work or client system.

## Install k6

- Linux: see https://k6.io/docs/get-started/installation/ (Debian/Ubuntu package, or download the binary from the k6 releases page).
- macOS: `brew install k6`
- Or in CI, this repo uses the `grafana/setup-k6-action` step.

## Run

```bash
k6 run k6/load-test.js
k6 run k6/stress-test.js
```

## What each script does

| Script | Load | Thresholds |
| --- | --- | --- |
| `load-test.js` | 10 VUs, 30s | p95 < 800 ms, error rate < 5%, checks > 95% |
| `stress-test.js` | ramps 10 -> 25 -> 50 VUs, ~90s | p95 < 1500 ms, error rate < 10%, checks > 90% |

If a threshold fails, k6 exits non-zero, so CI fails on it too.
