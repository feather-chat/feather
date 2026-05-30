package handler

import (
	"database/sql"
	"testing"
	"time"

	"github.com/enzyme/server/internal/auth"
	"github.com/enzyme/server/internal/channel"
	"github.com/enzyme/server/internal/config"
	"github.com/enzyme/server/internal/email"
	"github.com/enzyme/server/internal/emoji"
	"github.com/enzyme/server/internal/file"
	"github.com/enzyme/server/internal/message"
	"github.com/enzyme/server/internal/moderation"
	"github.com/enzyme/server/internal/notification"
	"github.com/enzyme/server/internal/openapi"
	"github.com/enzyme/server/internal/signing"
	"github.com/enzyme/server/internal/sse"
	"github.com/enzyme/server/internal/storage"
	"github.com/enzyme/server/internal/testutil"
	"github.com/enzyme/server/internal/thread"
	"github.com/enzyme/server/internal/user"
	"github.com/enzyme/server/internal/voice"
	"github.com/enzyme/server/internal/workspace"
)

// testHandlerWithVoice creates a Handler with voice dependencies wired up.
func testHandlerWithVoice(t *testing.T) (*Handler, *sql.DB) {
	t.Helper()

	db := testutil.TestDB(t)

	userRepo := user.NewRepository(db)
	workspaceRepo := workspace.NewRepository(db)
	channelRepo := channel.NewRepository(db)
	messageRepo := message.NewRepository(db)
	fileRepo := file.NewRepository(db)
	threadRepo := thread.NewRepository(db)
	emojiRepo := emoji.NewRepository(db)
	hub := sse.NewHub(db, 24*time.Hour)

	passwordResets := auth.NewPasswordResetRepo(db)
	emailVerifications := auth.NewEmailVerificationRepo(db)
	authService := auth.NewService(userRepo, passwordResets, emailVerifications, 4)

	sessionStore := auth.NewSessionStore(db, 24*time.Hour)

	notifPrefsRepo := notification.NewPreferencesRepository(db)
	notifPendingRepo := notification.NewPendingRepository(db)
	notifService := notification.NewService(notifPrefsRepo, notifPendingRepo, channelRepo, hub)

	moderationRepo := moderation.NewRepository(db)
	emailService := email.NewTestService(false, "http://localhost:8080")

	voiceRepo := voice.NewRepository(db)
	sfu, err := voice.NewSFU(config.VoiceConfig{Enabled: true, MaxPerChannel: 15})
	if err != nil {
		t.Fatalf("creating SFU: %v", err)
	}
	t.Cleanup(func() { sfu.Close() })

	h := New(Dependencies{
		AuthService:         authService,
		SessionStore:        sessionStore,
		UserRepo:            userRepo,
		WorkspaceRepo:       workspaceRepo,
		ChannelRepo:         channelRepo,
		MessageRepo:         messageRepo,
		FileRepo:            fileRepo,
		ThreadRepo:          threadRepo,
		EmojiRepo:           emojiRepo,
		ModerationRepo:      moderationRepo,
		NotificationService: notifService,
		EmailService:        emailService,
		Hub:                 hub,
		Signer:              signing.NewSigner("test-signing-secret"),
		Storage:             storage.NewLocal(t.TempDir()),
		MaxUploadSize:       10 * 1024 * 1024,
		PublicURL:           "http://localhost:8080",
		VoiceRepo:           voiceRepo,
		VoiceSFU:            sfu,
		VoiceMaxPerChannel:  2,
	})

	return h, db
}

func TestJoinVoiceChannel_Success(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	u := testutil.CreateTestUser(t, db, "user@test.com", "User")
	ws := testutil.CreateTestWorkspace(t, db, u.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, u.ID, "watercooler", "voice")

	ctx := ctxWithUser(t, h, u.ID)
	resp, err := h.JoinVoiceChannel(ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.JoinVoiceChannel200JSONResponse)
	if !ok {
		t.Fatalf("expected 200 response, got %T", resp)
	}
	if r.Offer.Sdp == "" {
		t.Error("expected non-empty SDP offer")
	}
	if len(r.IceServers) == 0 {
		t.Error("expected at least one ICE server")
	}
}

func TestJoinVoiceChannel_NotVoiceChannel(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	u := testutil.CreateTestUser(t, db, "user@test.com", "User")
	ws := testutil.CreateTestWorkspace(t, db, u.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, u.ID, "general", "public")

	ctx := ctxWithUser(t, h, u.ID)
	resp, err := h.JoinVoiceChannel(ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := resp.(openapi.JoinVoiceChannel400JSONResponse); !ok {
		t.Fatalf("expected 400 response, got %T", resp)
	}
}

func TestJoinVoiceChannel_MaxParticipants(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	owner := testutil.CreateTestUser(t, db, "owner@test.com", "Owner")
	ws := testutil.CreateTestWorkspace(t, db, owner.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, owner.ID, "watercooler", "voice")

	// Fill up the channel (max is 2)
	user1 := testutil.CreateTestUser(t, db, "user1@test.com", "User1")
	addWorkspaceMember(t, db, user1.ID, ws.ID, "member")
	ctx1 := ctxWithUser(t, h, user1.ID)
	if _, err := h.JoinVoiceChannel(ctx1, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("user1 join: %v", err)
	}

	user2 := testutil.CreateTestUser(t, db, "user2@test.com", "User2")
	addWorkspaceMember(t, db, user2.ID, ws.ID, "member")
	ctx2 := ctxWithUser(t, h, user2.ID)
	if _, err := h.JoinVoiceChannel(ctx2, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("user2 join: %v", err)
	}

	// Third user should be rejected
	user3 := testutil.CreateTestUser(t, db, "user3@test.com", "User3")
	addWorkspaceMember(t, db, user3.ID, ws.ID, "member")
	ctx3 := ctxWithUser(t, h, user3.ID)
	resp, err := h.JoinVoiceChannel(ctx3, openapi.JoinVoiceChannelRequestObject{Id: ch.ID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.JoinVoiceChannel409JSONResponse)
	if !ok {
		t.Fatalf("expected 409 response, got %T", resp)
	}
	if r.Error.Message != "Voice channel is full" {
		t.Errorf("message = %q, want %q", r.Error.Message, "Voice channel is full")
	}
}

func TestLeaveVoiceChannel_Success(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	u := testutil.CreateTestUser(t, db, "user@test.com", "User")
	ws := testutil.CreateTestWorkspace(t, db, u.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, u.ID, "watercooler", "voice")

	ctx := ctxWithUser(t, h, u.ID)

	// Join first
	if _, err := h.JoinVoiceChannel(ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("join: %v", err)
	}

	// Leave
	resp, err := h.LeaveVoiceChannel(ctx, openapi.LeaveVoiceChannelRequestObject{Id: ch.ID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.LeaveVoiceChannel200JSONResponse)
	if !ok {
		t.Fatalf("expected 200 response, got %T", resp)
	}
	if !r.Success {
		t.Error("expected success = true")
	}
}

func TestMuteVoice_Success(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	u := testutil.CreateTestUser(t, db, "user@test.com", "User")
	ws := testutil.CreateTestWorkspace(t, db, u.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, u.ID, "watercooler", "voice")

	ctx := ctxWithUser(t, h, u.ID)

	// Join first
	if _, err := h.JoinVoiceChannel(ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("join: %v", err)
	}

	// Mute
	resp, err := h.MuteVoice(ctx, openapi.MuteVoiceRequestObject{
		Id:   ch.ID,
		Body: &openapi.MuteVoiceJSONRequestBody{Muted: true},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.MuteVoice200JSONResponse)
	if !ok {
		t.Fatalf("expected 200 response, got %T", resp)
	}
	if !r.Success {
		t.Error("expected success = true")
	}
}

func TestDeafenVoice_Success(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	u := testutil.CreateTestUser(t, db, "user@test.com", "User")
	ws := testutil.CreateTestWorkspace(t, db, u.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, u.ID, "watercooler", "voice")

	ctx := ctxWithUser(t, h, u.ID)

	// Join first
	if _, err := h.JoinVoiceChannel(ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("join: %v", err)
	}

	// Deafen
	resp, err := h.DeafenVoice(ctx, openapi.DeafenVoiceRequestObject{
		Id:   ch.ID,
		Body: &openapi.DeafenVoiceJSONRequestBody{Deafened: true},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.DeafenVoice200JSONResponse)
	if !ok {
		t.Fatalf("expected 200 response, got %T", resp)
	}
	if !r.Success {
		t.Error("expected success = true")
	}
}

func TestServerMuteVoice_Success(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	admin := testutil.CreateTestUser(t, db, "admin@test.com", "Admin")
	ws := testutil.CreateTestWorkspace(t, db, admin.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, admin.ID, "watercooler", "voice")

	// Create a regular member and join voice
	member := testutil.CreateTestUser(t, db, "member@test.com", "Member")
	addWorkspaceMember(t, db, member.ID, ws.ID, "member")

	memberCtx := ctxWithUser(t, h, member.ID)
	if _, err := h.JoinVoiceChannel(memberCtx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("member join: %v", err)
	}

	// Admin server-mutes the member
	adminCtx := ctxWithUser(t, h, admin.ID)
	resp, err := h.ServerMuteVoice(adminCtx, openapi.ServerMuteVoiceRequestObject{
		Id: ch.ID,
		Body: &openapi.ServerMuteVoiceJSONRequestBody{
			UserId: member.ID,
			Muted:  true,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.ServerMuteVoice200JSONResponse)
	if !ok {
		t.Fatalf("expected 200 response, got %T", resp)
	}
	if !r.Success {
		t.Error("expected success = true")
	}
}

func TestServerMuteVoice_NonAdmin(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	owner := testutil.CreateTestUser(t, db, "owner@test.com", "Owner")
	ws := testutil.CreateTestWorkspace(t, db, owner.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, owner.ID, "watercooler", "voice")

	// Create two regular members
	member1 := testutil.CreateTestUser(t, db, "member1@test.com", "Member1")
	addWorkspaceMember(t, db, member1.ID, ws.ID, "member")
	member2 := testutil.CreateTestUser(t, db, "member2@test.com", "Member2")
	addWorkspaceMember(t, db, member2.ID, ws.ID, "member")

	// member2 joins voice
	member2Ctx := ctxWithUser(t, h, member2.ID)
	if _, err := h.JoinVoiceChannel(member2Ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("member2 join: %v", err)
	}

	// member1 (non-admin) tries to server-mute member2
	member1Ctx := ctxWithUser(t, h, member1.ID)
	resp, err := h.ServerMuteVoice(member1Ctx, openapi.ServerMuteVoiceRequestObject{
		Id: ch.ID,
		Body: &openapi.ServerMuteVoiceJSONRequestBody{
			UserId: member2.ID,
			Muted:  true,
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := resp.(openapi.ServerMuteVoice403JSONResponse); !ok {
		t.Fatalf("expected 403 response, got %T", resp)
	}
}

func TestListVoiceParticipants_Success(t *testing.T) {
	h, db := testHandlerWithVoice(t)

	u := testutil.CreateTestUser(t, db, "user@test.com", "User")
	ws := testutil.CreateTestWorkspace(t, db, u.ID, "WS")
	ch := testutil.CreateTestChannel(t, db, ws.ID, u.ID, "watercooler", "voice")

	ctx := ctxWithUser(t, h, u.ID)

	// Join voice
	if _, err := h.JoinVoiceChannel(ctx, openapi.JoinVoiceChannelRequestObject{Id: ch.ID}); err != nil {
		t.Fatalf("join: %v", err)
	}

	// List participants
	resp, err := h.ListVoiceParticipants(ctx, openapi.ListVoiceParticipantsRequestObject{Id: ch.ID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	r, ok := resp.(openapi.ListVoiceParticipants200JSONResponse)
	if !ok {
		t.Fatalf("expected 200 response, got %T", resp)
	}
	if len(r.Participants) != 1 {
		t.Fatalf("expected 1 participant, got %d", len(r.Participants))
	}
	if r.Participants[0].UserId != u.ID {
		t.Errorf("participant user_id = %q, want %q", r.Participants[0].UserId, u.ID)
	}
}
