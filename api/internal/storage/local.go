package storage

import (
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// Local implements Storage using the local filesystem.
type Local struct {
	basePath string
}

// NewLocal creates a local filesystem storage rooted at basePath.
func NewLocal(basePath string) *Local {
	return &Local{basePath: basePath}
}

func (l *Local) fullPath(key string) string {
	return filepath.Join(l.basePath, filepath.FromSlash(key))
}

func (l *Local) Put(_ context.Context, key string, r io.Reader, _ int64, _ string) error {
	p := l.fullPath(key)
	if err := os.MkdirAll(filepath.Dir(p), 0755); err != nil {
		return err
	}
	f, err := os.Create(p)
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		_ = os.Remove(p)
		return err
	}
	return nil
}

func (l *Local) Get(_ context.Context, key string) (io.ReadCloser, error) {
	return os.Open(l.fullPath(key))
}

func (l *Local) Delete(_ context.Context, key string) error {
	err := os.Remove(l.fullPath(key))
	if os.IsNotExist(err) {
		return nil
	}
	return err
}

func (l *Local) Serve(w http.ResponseWriter, r *http.Request, key string) {
	p := l.fullPath(key)
	if _, err := os.Stat(p); os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	http.ServeFile(w, r, p)
}

func (l *Local) SignedURL(_ context.Context, _ string, _ time.Duration) (string, error) {
	return "", nil
}
