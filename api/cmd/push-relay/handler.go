package main

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"time"
)

type notifyHandler struct {
	fcm  *FCMClient
	apns *APNsClient
}

func (h *notifyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	// Limit request body size.
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"request body too large"}`, http.StatusBadRequest)
		return
	}

	var req NotifyRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if err := req.Validate(); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	var status string
	var sendErr error

	switch req.Platform {
	case "fcm":
		if h.fcm == nil {
			writeJSON(w, http.StatusServiceUnavailable, NotifyResponse{
				Status: "error",
				Error:  "FCM client not configured",
			})
			return
		}
		status, sendErr = h.fcm.Send(r.Context(), &req)
	case "apns":
		if h.apns == nil {
			writeJSON(w, http.StatusServiceUnavailable, NotifyResponse{
				Status: "error",
				Error:  "APNs client not configured",
			})
			return
		}
		status, sendErr = h.apns.Send(r.Context(), &req)
	}

	resp := NotifyResponse{Status: status}
	if sendErr != nil {
		resp.Error = sendErr.Error()
	}

	slog.Info("push notification dispatched",
		"platform", req.Platform,
		"status", status,
		"latency_ms", time.Since(start).Milliseconds(),
	)

	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}
