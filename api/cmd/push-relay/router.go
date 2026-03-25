package main

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func newRouter(fcm, apns Dispatcher, rateLimiter *RateLimiter, trustProxy bool, authSecret string) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	if trustProxy {
		r.Use(middleware.RealIP)
	}

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		resp := HealthResponse{
			Status: "ok",
			FCM:    fcm != nil,
			APNs:   apns != nil,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	})

	notify := (&notifyHandler{fcm: fcm, apns: apns}).ServeHTTP
	if authSecret != "" {
		notify = requireAuthSecret(authSecret, notify)
	}
	r.With(rateLimiter.Middleware).Post("/notify", notify)

	return r
}

// requireAuthSecret returns middleware that validates the Authorization: Bearer header
// against the configured secret.
func requireAuthSecret(secret string, next http.HandlerFunc) http.HandlerFunc {
	expected := []byte("Bearer " + secret)
	return func(w http.ResponseWriter, r *http.Request) {
		token := []byte(r.Header.Get("Authorization"))
		if subtle.ConstantTimeCompare(token, expected) != 1 {
			writeJSON(w, http.StatusUnauthorized, NotifyResponse{
				Status: "error",
				Error:  "unauthorized",
			})
			return
		}
		next(w, r)
	}
}
