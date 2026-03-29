## Scaling Investigation Results (2026-03-29)

### Server: 1GB/1vCPU DigitalOcean droplet (`chat.enzyme.im`)

### Changes deployed

1. **Pre-formatted SSE frames** — `SerializedEvent` now contains a pre-built `Frame []byte` with the complete SSE wire format (`id: ...\ndata: ...\n\n`). Per-connection write is `w.Write(frame)` instead of `fmt.Fprintf`. Eliminated 16% CPU overhead from the profile (16% → 0% flat).

2. **Increased default MaxOpenConns from 2 to 10** — allows concurrent DB readers under WAL mode. Production config updated from 4 to 10.

3. **Added pprof server** — `server.pprof_addr` config option starts a debug HTTP server for runtime profiling.

### Key finding: TLS is NOT the bottleneck

Disabling TLS entirely (HTTP on port 9090, no encryption) produced identical throughput:

| Metric | With TLS | Without TLS |
|---|---|---|
| Msg/sec (2000 conn) | ~12/s | ~12/s |
| Events/sec | ~35k | ~35k |
| Latency p50 | 780ms | 779ms |

The bottleneck is **goroutine scheduling contention and syscall overhead** from writing to 2000 individual TCP sockets. Each SSE connection has its own goroutine in a `select` loop; with 2000 of them active, the Go runtime spends significant time on context switching and channel operations. Message send handler goroutines get starved for CPU time.

**Caddy/nginx TLS termination would not help** — the overhead is in socket writes and goroutine scheduling, not encryption.

### Connection scaling results

All tests: 5 msg/sec/user × 8 users = 40 msg/sec target.

| Connections | Msg/sec | Msg errors | Events/sec | Latency p50 | Latency p95 | Peak memory |
|---|---|---|---|---|---|---|
| 100 | **40/s** | 3 | ~5.8k | 104ms | 159ms | - |
| 2000 | ~12/s | 4-11 | ~35k | 780ms | 3.6s | 276MB |
| 3000 | ~8/s | 51 | ~26k | 939ms | 8.9s | - |
| 4000 | ~4/s | 51 | ~17k | 1.6s | 11.5s | 479MB |

The server handles 4000 SSE connections without crashing (no OOM on 961MB), but message throughput degrades linearly. At 3000+ connections, SQLITE_BUSY errors jump from ~10 to ~51.

### CPU profile breakdown (30s during 2000-connection test)

Total CPU utilization: ~60% of 1 vCPU.

| Component | CPU % | Notes |
|---|---|---|
| Syscall6 (socket writes) | 29% | Kernel-level TCP writes to 2000 sockets |
| crypto/tls.Write | 39% cum | TLS encryption per write (but removing TLS didn't help!) |
| runtime.selectgo | 11% | Go select loop in 2000 SSE goroutines |
| runtime.sellock | 5% | Lock contention in select |
| runtime.chansend | 7% | Sending events to 2000 client channels |
| writeSerializedEvent | 1.7% | Down from 16% after pre-formatting fix |
| SendMessage handler | 8% | DB reads + broadcast + response |
| AES-GCM encryption | 4.3% | TLS cipher operations |

The SSE handler (`Events`) consumes 76% of CPU cumulatively. The SendMessage handler only uses 8%, with DB operations at ~4% and broadcast channel sends at ~4%.

### Answers to NEXT.md questions

**Q1: Why is throughput only 15 msg/sec?**

Goroutine scheduling contention. With 2000 SSE goroutines in active `select` loops, the Go runtime spends ~16% of CPU on scheduling overhead (`selectgo` + `sellock`). Message handler goroutines are starved — they only get 8% of CPU despite needing very little. This is confirmed by the 100-connection test achieving full 40 msg/sec throughput.

Not SQLite (only 4% CPU in DB), not TLS (removing it didn't help), not the stress test client (achieves 40/s at 100 connections), not connection pool starvation (increased to 10 but no throughput change).

**Q2: Would TLS termination at a reverse proxy help?**

No. Tested by disabling TLS entirely — zero improvement. The overhead is syscalls + goroutine scheduling, not encryption. Caddy would actually make things worse by adding proxy buffering latency.

**Q3: What's the connection count wall?**

Practical wall is around 3000-4000 connections on 1GB/1vCPU:
- At 3000: message errors jump 5x (51 vs ~10), throughput drops to 8 msg/sec
- At 4000: peak memory hits 479MB (50% of RAM), throughput drops to 4 msg/sec
- No OOM at 4000, but close to the limit. 5000 would likely OOM.
- TCP memory (324 pages) is well below kernel pressure threshold (75k pages)

The wall is CPU-bound (goroutine scheduling), not memory-bound or network-bound.

**Q4: Pre-formatting SSE frames**

Done. `fmt.Fprintf` went from 16% flat CPU → 0%. The remaining `fmt.Fprintf` (2.26% cum) is HTTP request logging. Fan-out rate is marginally improved.

### What would actually help

1. **More vCPUs** — GOMAXPROCS=2 would roughly double capacity by giving the runtime two OS threads. A 2vCPU droplet should handle 4000+ connections at 40 msg/sec.

2. **Epoll-based SSE writer** — replace per-connection goroutines with a single writer that uses epoll to batch socket writes. Eliminates goroutine scheduling overhead entirely. Significant refactor.

3. **HTTP/2 for SSE** — currently disabled because "all streams share a single TCP connection's write buffer." But HTTP/2 multiplexing would eliminate per-connection syscalls. Worth re-evaluating if the write serialization can be solved (e.g., with buffered writes).

4. **Reduce fan-out scope** — channel-scoped events already filter by membership, but workspace-scoped events (presence, typing) still fan out to all 2000 connections. Rate-limiting presence broadcasts or batching them would reduce write volume.
