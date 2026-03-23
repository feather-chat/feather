package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRateLimiter_AllowsWithinLimit(t *testing.T) {
	rl := NewRateLimiter(60) // 1 per second
	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// First two requests should succeed (burst of 2).
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/notify", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("request %d: expected 200, got %d", i+1, w.Code)
		}
	}
}

func TestRateLimiter_BlocksOverLimit(t *testing.T) {
	rl := NewRateLimiter(60) // 1 per second, burst 2
	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Exhaust burst.
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/notify", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
	}

	// Third request should be rate limited.
	req := httptest.NewRequest(http.MethodPost, "/notify", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	if w.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", w.Code)
	}
	if w.Header().Get("Retry-After") == "" {
		t.Error("expected Retry-After header")
	}
}

func TestRateLimiter_SeparateIPsHaveSeparateLimits(t *testing.T) {
	rl := NewRateLimiter(60)
	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Exhaust burst for IP A.
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodPost, "/notify", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
	}

	// IP B should still be allowed.
	req := httptest.NewRequest(http.MethodPost, "/notify", nil)
	req.RemoteAddr = "5.6.7.8:5678"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for different IP, got %d", w.Code)
	}
}
