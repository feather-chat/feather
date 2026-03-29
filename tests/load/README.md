# Load Tests

Performance and stress tests using [K6](https://grafana.com/docs/k6/).

## Prerequisites

```bash
brew install k6   # macOS
```

The server must be running with seed data:

```bash
make seed
make dev   # in another terminal
```

## Running

```bash
# Run all load tests sequentially
make load-test

# Run individual test suites
make load-test-auth         # Authentication (login/register)
make load-test-messaging    # Messages (send/list/react/search)
make load-test-sse          # SSE connections (100 concurrent, ~80s)
make load-test-full         # Realistic mixed workflow

# SSE stress test (not included in load-test — runs longer)
make load-test-sse-stress                        # 100 connections, 2m
make load-test-sse-stress SSE_CONNECTIONS=2000   # 2000 connections

# Against a remote server
make load-test K6_BASE_URL=https://chat.enzyme.im
make load-test-sse-stress K6_BASE_URL=https://chat.enzyme.im SSE_CONNECTIONS=2000

# With extra K6 flags (e.g., summary export)
make load-test-full K6_FLAGS="--summary-export=results.json"
```

Or run K6 directly:

```bash
k6 run tests/load/auth.js
k6 run tests/load/sse-stress.js --env K6_BASE_URL=https://chat.enzyme.im --env SSE_CONNECTIONS=2000
```

## Test Suites

| File             | What it tests                                             | Key metrics                    |
| ---------------- | --------------------------------------------------------- | ------------------------------ |
| `auth.js`        | Login throughput, registration burst                      | login/register latency, errors |
| `messaging.js`   | Message send/list/search under concurrent write load      | SQLite contention, p95 latency |
| `sse.js`         | SSE connections and event delivery (~100 concurrent)      | connection errors, event count |
| `sse-stress.js`  | Thousands of SSE connections + fan-out latency measurement | p50/p95 latency, throughput    |
| `full.js`        | Realistic mixed workflow (browse, read, send, react, search) | end-to-end workflow latency |

## SSE Stress Test

The stress test (`sse-stress.js`) holds many concurrent SSE connections while sending messages, reactions, and typing indicators. It measures end-to-end fan-out latency: the time from sending a message via the API to receiving it as an SSE event on every connected client.

Configuration via environment variables:

| Variable | Default | Description |
|---|---|---|
| `SSE_CONNECTIONS` | `100` | Number of concurrent SSE connections |
| `SSE_DURATION` | `2m` | How long to hold connections after ramp-up |
| `SSE_MSG_RATE` | `5` | Messages per second during activity phase |
| `SSE_RAMP` | `30s` | Ramp-up duration |

SSE support uses the [xk6-sse](https://github.com/phymbert/xk6-sse) extension, which K6 resolves automatically at runtime (no custom build needed).

## Thresholds

Each test defines pass/fail thresholds. K6 exits non-zero if thresholds are breached:

- **Error rate**: < 1% HTTP failures
- **p95 latency**: < 500ms for most endpoints, < 800ms for writes, < 1s for search
- **SSE connections**: < 10 connection failures (< 50 for stress test)

## Files

- `helpers.js` — Shared config, auth helpers, API wrappers, threshold presets
- `auth.js` — Authentication load test
- `messaging.js` — Messaging load test
- `sse.js` — SSE connection and delivery test
- `sse-stress.js` — SSE stress test with fan-out latency measurement
- `full.js` — Full workflow load test
