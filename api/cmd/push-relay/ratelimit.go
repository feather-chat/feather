package main

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const staleEntryTTL = 10 * time.Minute

type ipEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimiter implements per-IP rate limiting with periodic cleanup.
type RateLimiter struct {
	mu      sync.Mutex
	entries map[string]*ipEntry
	limit   rate.Limit
	burst   int
}

// NewRateLimiter creates a rate limiter with the given requests-per-minute limit.
func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	rl := &RateLimiter{
		entries: make(map[string]*ipEntry),
		limit:   rate.Limit(float64(requestsPerMinute) / 60.0),
		burst:   2,
	}
	go rl.cleanup()
	return rl
}

// Middleware returns an HTTP middleware that enforces the rate limit.
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr // RealIP middleware sets this to the actual client IP

		limiter := rl.getLimiter(ip)
		if !limiter.Allow() {
			retryAfter := int(time.Second / time.Duration(rl.limit))
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	entry, ok := rl.entries[ip]
	if !ok {
		entry = &ipEntry{
			limiter: rate.NewLimiter(rl.limit, rl.burst),
		}
		rl.entries[ip] = entry
	}
	entry.lastSeen = time.Now()
	return entry.limiter
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		cutoff := time.Now().Add(-staleEntryTTL)
		for ip, entry := range rl.entries {
			if entry.lastSeen.Before(cutoff) {
				delete(rl.entries, ip)
			}
		}
		rl.mu.Unlock()
	}
}
