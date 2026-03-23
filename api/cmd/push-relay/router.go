package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// HealthResponse is returned by the GET /health endpoint.
type HealthResponse struct {
	Status string `json:"status"`
	FCM    bool   `json:"fcm"`
	APNs   bool   `json:"apns"`
}

func newRouter(fcm *FCMClient, apns *APNsClient, rateLimiter *RateLimiter) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(rateLimiter.Middleware)
	r.Use(requestLogger)

	r.Post("/notify", (&notifyHandler{fcm: fcm, apns: apns}).ServeHTTP)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		resp := HealthResponse{
			Status: "ok",
			FCM:    fcm != nil,
			APNs:   apns != nil,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	})

	return r
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		slog.Debug("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.Status(),
			"latency_ms", time.Since(start).Milliseconds(),
			"ip", r.RemoteAddr,
		)
	})
}
