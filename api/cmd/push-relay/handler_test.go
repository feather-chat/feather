package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// mockFCM implements the same Send signature as FCMClient for testing.
type mockFCM struct {
	status string
	err    error
}

func (m *mockFCM) Send(_ context.Context, _ *NotifyRequest) (string, error) {
	return m.status, m.err
}

// mockAPNs implements the same Send signature as APNsClient for testing.
type mockAPNs struct {
	status string
	err    error
}

func (m *mockAPNs) Send(_ context.Context, _ *NotifyRequest) (string, error) {
	return m.status, m.err
}

// dispatcher abstracts FCM/APNs clients for the handler.
type dispatcher interface {
	Send(ctx context.Context, req *NotifyRequest) (string, error)
}

// testHandler creates a handler that uses dispatcher interfaces for testing.
func testHandler(fcm, apns dispatcher) http.Handler {
	return newTestRouter(fcm, apns)
}

func newTestRouter(fcm, apns dispatcher) http.Handler {
	// Build a minimal router for testing the notify endpoint directly.
	mux := http.NewServeMux()
	h := &testNotifyHandler{fcm: fcm, apns: apns}
	mux.Handle("POST /notify", h)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		resp := HealthResponse{
			Status: "ok",
			FCM:    fcm != nil,
			APNs:   apns != nil,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp) //nolint:errcheck
	})
	return mux
}

// testNotifyHandler is a test version that uses the dispatcher interface.
type testNotifyHandler struct {
	fcm  dispatcher
	apns dispatcher
}

func (h *testNotifyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)

	var req NotifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
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
			writeJSON(w, http.StatusServiceUnavailable, NotifyResponse{Status: "error", Error: "FCM client not configured"})
			return
		}
		status, sendErr = h.fcm.Send(r.Context(), &req)
	case "apns":
		if h.apns == nil {
			writeJSON(w, http.StatusServiceUnavailable, NotifyResponse{Status: "error", Error: "APNs client not configured"})
			return
		}
		status, sendErr = h.apns.Send(r.Context(), &req)
	}

	resp := NotifyResponse{Status: status}
	if sendErr != nil {
		resp.Error = sendErr.Error()
	}
	writeJSON(w, http.StatusOK, resp)
}

func TestHandler_ValidFCMRequest(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, nil)
	body := `{"device_token":"tok123","platform":"fcm","title":"Hello","body":"World"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp NotifyResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "sent" {
		t.Errorf("expected status \"sent\", got %q", resp.Status)
	}
}

func TestHandler_ValidAPNsRequest(t *testing.T) {
	handler := testHandler(nil, &mockAPNs{status: "sent"})
	body := `{"device_token":"tok123","platform":"apns","title":"Hello","body":"World"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp NotifyResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "sent" {
		t.Errorf("expected status \"sent\", got %q", resp.Status)
	}
}

func TestHandler_InvalidToken(t *testing.T) {
	handler := testHandler(&mockFCM{status: "invalid_token"}, nil)
	body := `{"device_token":"bad-tok","platform":"fcm","title":"Hello"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp NotifyResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "invalid_token" {
		t.Errorf("expected status \"invalid_token\", got %q", resp.Status)
	}
}

func TestHandler_DispatchError(t *testing.T) {
	handler := testHandler(&mockFCM{status: "error", err: fmt.Errorf("connection refused")}, nil)
	body := `{"device_token":"tok123","platform":"fcm","title":"Hello"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp NotifyResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "error" {
		t.Errorf("expected status \"error\", got %q", resp.Status)
	}
	if resp.Error == "" {
		t.Error("expected error message")
	}
}

func TestHandler_MissingFields(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, nil)
	body := `{"platform":"fcm"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, nil)
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader("not json"))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_OversizedBody(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, nil)
	// Create a body larger than 4 KB.
	largeBody := `{"device_token":"tok","platform":"fcm","title":"Hello","body":"` + strings.Repeat("x", 5000) + `"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(largeBody))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_FCMNotConfigured(t *testing.T) {
	handler := testHandler(nil, &mockAPNs{status: "sent"})
	body := `{"device_token":"tok123","platform":"fcm","title":"Hello"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", w.Code)
	}
}

func TestHandler_APNsNotConfigured(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, nil)
	body := `{"device_token":"tok123","platform":"apns","title":"Hello"}`
	req := httptest.NewRequest(http.MethodPost, "/notify", strings.NewReader(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", w.Code)
	}
}

func TestHealth_BothConfigured(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, &mockAPNs{status: "sent"})
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp HealthResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "ok" {
		t.Errorf("expected status \"ok\", got %q", resp.Status)
	}
	if !resp.FCM {
		t.Error("expected FCM true")
	}
	if !resp.APNs {
		t.Error("expected APNs true")
	}
}

func TestHealth_OnlyFCM(t *testing.T) {
	handler := testHandler(&mockFCM{status: "sent"}, nil)
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	var resp HealthResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "ok" {
		t.Errorf("expected status \"ok\", got %q", resp.Status)
	}
	if !resp.FCM {
		t.Error("expected FCM true")
	}
	if resp.APNs {
		t.Error("expected APNs false")
	}
}
