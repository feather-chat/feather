package storage

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestLocal_PutGetDelete(t *testing.T) {
	dir := t.TempDir()
	s := NewLocal(dir)
	ctx := context.Background()

	data := []byte("hello world")
	key := "a/b/test.txt"

	// Put
	if err := s.Put(ctx, key, bytes.NewReader(data), int64(len(data)), "text/plain"); err != nil {
		t.Fatalf("Put: %v", err)
	}

	// Verify file exists on disk
	if _, err := os.Stat(filepath.Join(dir, "a", "b", "test.txt")); err != nil {
		t.Fatalf("file not on disk: %v", err)
	}

	// Get
	rc, err := s.Get(ctx, key)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	got, _ := io.ReadAll(rc)
	rc.Close()
	if !bytes.Equal(got, data) {
		t.Fatalf("Get returned %q, want %q", got, data)
	}

	// Delete
	if err := s.Delete(ctx, key); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	// Get after delete should fail
	if _, err := s.Get(ctx, key); err == nil {
		t.Fatal("expected error after delete")
	}

	// Delete again (not-found is not an error)
	if err := s.Delete(ctx, key); err != nil {
		t.Fatalf("Delete not-found: %v", err)
	}
}

func TestLocal_Serve(t *testing.T) {
	dir := t.TempDir()
	s := NewLocal(dir)
	ctx := context.Background()

	data := []byte("serve me")
	key := "serve.txt"
	if err := s.Put(ctx, key, bytes.NewReader(data), int64(len(data)), "text/plain"); err != nil {
		t.Fatalf("Put: %v", err)
	}

	// Serve existing file
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/serve.txt", nil)
	s.Serve(rr, req, key)
	if rr.Code != http.StatusOK {
		t.Fatalf("Serve status = %d, want 200", rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), data) {
		t.Fatalf("Serve body = %q, want %q", rr.Body.String(), data)
	}

	// Serve missing file
	rr = httptest.NewRecorder()
	s.Serve(rr, req, "missing.txt")
	if rr.Code != http.StatusNotFound {
		t.Fatalf("Serve missing status = %d, want 404", rr.Code)
	}
}

func TestLocal_SignedURL(t *testing.T) {
	s := NewLocal(t.TempDir())
	url, err := s.SignedURL(context.Background(), "anything", 0)
	if err != nil {
		t.Fatalf("SignedURL: %v", err)
	}
	if url != "" {
		t.Fatalf("expected empty URL, got %q", url)
	}
}
