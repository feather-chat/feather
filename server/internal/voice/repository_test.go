package voice_test

import (
	"context"
	"testing"
	"time"

	"github.com/enzyme/server/internal/testutil"
	"github.com/enzyme/server/internal/voice"
)

func TestAddAndGetParticipant(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	user := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	ws := testutil.CreateTestWorkspace(t, db, user.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, user.ID, "voice-room", "voice")

	// Add participant
	p, err := repo.AddParticipant(ctx, ch.ID, user.ID)
	if err != nil {
		t.Fatalf("AddParticipant: %v", err)
	}
	if p.ChannelID != ch.ID || p.UserID != user.ID {
		t.Fatalf("participant mismatch: got channel=%s user=%s", p.ChannelID, p.UserID)
	}
	if p.IsMuted || p.IsDeafened || p.IsServerMuted {
		t.Fatal("new participant should not be muted/deafened")
	}

	// Get participant
	got, err := repo.GetParticipant(ctx, ch.ID, user.ID)
	if err != nil {
		t.Fatalf("GetParticipant: %v", err)
	}
	if got.ID != p.ID {
		t.Fatalf("expected ID %s, got %s", p.ID, got.ID)
	}
}

func TestGetParticipants(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	alice := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	bob := testutil.CreateTestUser(t, db, "bob@example.com", "Bob")
	ws := testutil.CreateTestWorkspace(t, db, alice.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, alice.ID, "voice-room", "voice")

	// Add workspace membership for bob
	testutil.CreateTestWorkspace(t, db, bob.ID, "other-ws") // just to have bob in system

	if _, err := repo.AddParticipant(ctx, ch.ID, alice.ID); err != nil {
		t.Fatalf("AddParticipant alice: %v", err)
	}
	if _, err := repo.AddParticipant(ctx, ch.ID, bob.ID); err != nil {
		t.Fatalf("AddParticipant bob: %v", err)
	}

	participants, err := repo.GetParticipants(ctx, ch.ID)
	if err != nil {
		t.Fatalf("GetParticipants: %v", err)
	}
	if len(participants) != 2 {
		t.Fatalf("expected 2 participants, got %d", len(participants))
	}
	// Should have display names from user join
	if participants[0].DisplayName != "Alice" {
		t.Errorf("expected Alice, got %s", participants[0].DisplayName)
	}
}

func TestRemoveParticipant(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	user := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	ws := testutil.CreateTestWorkspace(t, db, user.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, user.ID, "voice-room", "voice")

	if _, err := repo.AddParticipant(ctx, ch.ID, user.ID); err != nil {
		t.Fatalf("AddParticipant: %v", err)
	}

	if err := repo.RemoveParticipant(ctx, ch.ID, user.ID); err != nil {
		t.Fatalf("RemoveParticipant: %v", err)
	}

	isP, err := repo.IsParticipant(ctx, ch.ID, user.ID)
	if err != nil {
		t.Fatalf("IsParticipant: %v", err)
	}
	if isP {
		t.Fatal("expected participant to be removed")
	}
}

func TestUpdateMuteState(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	user := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	ws := testutil.CreateTestWorkspace(t, db, user.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, user.ID, "voice-room", "voice")

	if _, err := repo.AddParticipant(ctx, ch.ID, user.ID); err != nil {
		t.Fatalf("AddParticipant: %v", err)
	}

	// Mute
	if err := repo.UpdateMuteState(ctx, ch.ID, user.ID, true, false, false); err != nil {
		t.Fatalf("UpdateMuteState: %v", err)
	}
	p, _ := repo.GetParticipant(ctx, ch.ID, user.ID)
	if !p.IsMuted {
		t.Fatal("expected muted")
	}
	if p.IsDeafened || p.IsServerMuted {
		t.Fatal("only muted should be set")
	}

	// Deafen + mute
	if err := repo.UpdateMuteState(ctx, ch.ID, user.ID, true, true, false); err != nil {
		t.Fatalf("UpdateMuteState: %v", err)
	}
	p, _ = repo.GetParticipant(ctx, ch.ID, user.ID)
	if !p.IsDeafened || !p.IsMuted {
		t.Fatal("expected muted and deafened")
	}

	// Server mute
	if err := repo.UpdateMuteState(ctx, ch.ID, user.ID, true, true, true); err != nil {
		t.Fatalf("UpdateMuteState: %v", err)
	}
	p, _ = repo.GetParticipant(ctx, ch.ID, user.ID)
	if !p.IsServerMuted {
		t.Fatal("expected server muted")
	}
}

func TestIsParticipantAndCount(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	user := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	ws := testutil.CreateTestWorkspace(t, db, user.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, user.ID, "voice-room", "voice")

	isP, _ := repo.IsParticipant(ctx, ch.ID, user.ID)
	if isP {
		t.Fatal("should not be participant before join")
	}

	count, _ := repo.GetParticipantCount(ctx, ch.ID)
	if count != 0 {
		t.Fatalf("expected 0 participants, got %d", count)
	}

	repo.AddParticipant(ctx, ch.ID, user.ID)

	isP, _ = repo.IsParticipant(ctx, ch.ID, user.ID)
	if !isP {
		t.Fatal("should be participant after join")
	}

	count, _ = repo.GetParticipantCount(ctx, ch.ID)
	if count != 1 {
		t.Fatalf("expected 1 participant, got %d", count)
	}
}

func TestRemoveAllParticipants(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	alice := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	bob := testutil.CreateTestUser(t, db, "bob@example.com", "Bob")
	ws := testutil.CreateTestWorkspace(t, db, alice.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, alice.ID, "voice-room", "voice")

	repo.AddParticipant(ctx, ch.ID, alice.ID)
	repo.AddParticipant(ctx, ch.ID, bob.ID)

	if err := repo.RemoveAllParticipants(ctx, ch.ID); err != nil {
		t.Fatalf("RemoveAllParticipants: %v", err)
	}

	count, _ := repo.GetParticipantCount(ctx, ch.ID)
	if count != 0 {
		t.Fatalf("expected 0, got %d", count)
	}
}

func TestRemoveStaleParticipants(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	user := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	ws := testutil.CreateTestWorkspace(t, db, user.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, user.ID, "voice-room", "voice")

	repo.AddParticipant(ctx, ch.ID, user.ID)

	// With 1 hour max age, the participant just created should NOT be stale
	n, err := repo.RemoveStaleParticipants(ctx, time.Hour)
	if err != nil {
		t.Fatalf("RemoveStaleParticipants: %v", err)
	}
	if n != 0 {
		t.Fatalf("expected 0 stale, got %d", n)
	}

	// With a very large max age that puts the cutoff in the future, everything is stale
	n, err = repo.RemoveStaleParticipants(ctx, -time.Hour)
	if err != nil {
		t.Fatalf("RemoveStaleParticipants: %v", err)
	}
	if n != 1 {
		t.Fatalf("expected 1 stale, got %d", n)
	}
}

func TestDuplicateParticipant(t *testing.T) {
	db := testutil.TestDB(t)
	repo := voice.NewRepository(db)
	ctx := context.Background()

	user := testutil.CreateTestUser(t, db, "alice@example.com", "Alice")
	ws := testutil.CreateTestWorkspace(t, db, user.ID, "test-ws")
	ch := testutil.CreateTestChannel(t, db, ws.ID, user.ID, "voice-room", "voice")

	if _, err := repo.AddParticipant(ctx, ch.ID, user.ID); err != nil {
		t.Fatalf("first AddParticipant: %v", err)
	}

	// Second add should fail (UNIQUE constraint)
	if _, err := repo.AddParticipant(ctx, ch.ID, user.ID); err == nil {
		t.Fatal("expected error on duplicate participant")
	}
}
