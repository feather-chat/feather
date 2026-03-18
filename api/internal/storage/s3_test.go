package storage

import (
	"testing"
)

// TestS3_ImplementsStorage is a compile-time check that S3 satisfies the Storage interface.
func TestS3_ImplementsStorage(t *testing.T) {
	var _ Storage = (*S3)(nil)
}
