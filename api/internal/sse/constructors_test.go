package sse

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/enzyme/api/internal/openapi"
)

func TestTypedConstructors(t *testing.T) {
	tests := []struct {
		name     string
		event    Event
		wantType string
	}{
		{"connected", NewConnectedEvent(openapi.ConnectedData{ClientId: "c1"}), EventConnected},
		{"heartbeat", NewHeartbeatEvent(openapi.HeartbeatData{Timestamp: 1}), EventHeartbeat},
		{"message.new", NewMessageNewEvent(openapi.MessageWithUser{Id: "m1"}), EventMessageNew},
		{"message.updated", NewMessageUpdatedEvent(openapi.MessageWithUser{Id: "m1"}), EventMessageUpdated},
		{"message.deleted", NewMessageDeletedEvent(openapi.MessageDeletedData{Id: "m1"}), EventMessageDeleted},
		{"reaction.added", NewReactionAddedEvent(openapi.Reaction{Id: "r1"}), EventReactionAdded},
		{"reaction.removed", NewReactionRemovedEvent(openapi.ReactionRemovedData{MessageId: "m1", UserId: "u1", Emoji: "\U0001f44d"}), EventReactionRemoved},
		{"channel.created", NewChannelCreatedEvent(openapi.Channel{Id: "c1"}), EventChannelCreated},
		{"channel.updated", NewChannelUpdatedEvent(openapi.Channel{Id: "c1"}), EventChannelUpdated},
		{"channel.archived", NewChannelArchivedEvent(openapi.Channel{Id: "c1"}), EventChannelArchived},
		{"channel.member_added", NewChannelMemberAddedEvent(openapi.ChannelMemberData{ChannelId: "c1", UserId: "u1"}), EventMemberAdded},
		{"channel.member_removed", NewChannelMemberRemovedEvent(openapi.ChannelMemberData{ChannelId: "c1", UserId: "u1"}), EventMemberRemoved},
		{"channel.read", NewChannelReadEvent(openapi.ChannelReadEventData{ChannelId: "c1", LastReadMessageId: "m1"}), EventChannelRead},
		{"typing.start", NewTypingStartEvent(openapi.TypingEventData{UserId: "u1", ChannelId: "c1"}), EventTypingStart},
		{"typing.stop", NewTypingStopEvent(openapi.TypingEventData{UserId: "u1", ChannelId: "c1"}), EventTypingStop},
		{"presence.changed", NewPresenceChangedEvent(openapi.PresenceData{UserId: "u1", Status: openapi.Online}), EventPresenceChanged},
		{"presence.initial", NewPresenceInitialEvent(openapi.PresenceInitialData{OnlineUserIds: []string{"u1"}}), EventPresenceInitial},
		{"notification", NewNotificationEvent(openapi.NotificationData{Type: openapi.NotificationDataTypeMention, ChannelId: "c1", MessageId: "m1"}), EventNotification},
		{"emoji.created", NewEmojiCreatedEvent(openapi.CustomEmoji{Id: "e1"}), EventEmojiCreated},
		{"emoji.deleted", NewEmojiDeletedEvent(openapi.EmojiDeletedData{Id: "e1", Name: "wave"}), EventEmojiDeleted},
		{"message.pinned", NewMessagePinnedEvent(openapi.MessageWithUser{Id: "m1"}), EventMessagePinned},
		{"message.unpinned", NewMessageUnpinnedEvent(openapi.MessageWithUser{Id: "m1"}), EventMessageUnpinned},
		{"member.banned", NewMemberBannedEvent(openapi.WorkspaceMemberData{UserId: "u1", WorkspaceId: "w1"}), EventMemberBanned},
		{"member.unbanned", NewMemberUnbannedEvent(openapi.WorkspaceMemberData{UserId: "u1", WorkspaceId: "w1"}), EventMemberUnbanned},
		{"member.left", NewMemberLeftEvent(openapi.WorkspaceMemberData{UserId: "u1", WorkspaceId: "w1"}), EventMemberLeft},
		{"member.role_changed", NewMemberRoleChangedEvent(openapi.MemberRoleChangedData{UserId: "u1", OldRole: "member", NewRole: "admin"}), EventMemberRoleChanged},
		{"workspace.updated", NewWorkspaceUpdatedEvent(openapi.Workspace{Id: "w1"}), EventWorkspaceUpdated},
		{"scheduled_message.created", NewScheduledMessageCreatedEvent(openapi.ScheduledMessage{Id: "s1"}), EventScheduledMessageCreated},
		{"scheduled_message.updated", NewScheduledMessageUpdatedEvent(openapi.ScheduledMessage{Id: "s1"}), EventScheduledMessageUpdated},
		{"scheduled_message.deleted", NewScheduledMessageDeletedEvent(openapi.ScheduledMessageDeletedData{Id: "s1"}), EventScheduledMessageDeleted},
		{"scheduled_message.sent", NewScheduledMessageSentEvent(openapi.ScheduledMessageSentData{Id: "s1", ChannelId: "c1", MessageId: "m1"}), EventScheduledMessageSent},
		{"scheduled_message.failed", NewScheduledMessageFailedEvent(openapi.ScheduledMessageFailedData{Id: "s1", ChannelId: "c1", Error: "timeout"}), EventScheduledMessageFailed},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.event.Type != tt.wantType {
				t.Errorf("Type = %q, want %q", tt.event.Type, tt.wantType)
			}
			if tt.event.Data == nil {
				t.Error("Data is nil")
			}
			// Verify data marshals to valid JSON
			if _, err := json.Marshal(tt.event.Data); err != nil {
				t.Errorf("Data failed to marshal: %v", err)
			}
		})
	}
}

func TestNewChannelsInvalidateEvent(t *testing.T) {
	e := NewChannelsInvalidateEvent()
	if e.Type != EventChannelsInvalidate {
		t.Errorf("Type = %q, want %q", e.Type, EventChannelsInvalidate)
	}
	// Data is intentionally nil for signal events
	if e.Data != nil {
		t.Error("signal event should have nil Data")
	}
}

// TestNoRawEventConstruction scans Go source files outside the sse package for
// raw sse.Event{} struct literals. All event construction should use typed
// constructors (e.g., sse.NewMessageNewEvent) to maintain compile-time safety.
func TestNoRawEventConstruction(t *testing.T) {
	apiRoot := filepath.Join("..", "..")

	err := filepath.Walk(apiRoot, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if info.Name() == "node_modules" || info.Name() == ".git" || info.Name() == "vendor" {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(path, ".go") {
			return nil
		}
		// Allow raw construction within the sse package itself
		absPath, err := filepath.Abs(path)
		if err != nil {
			t.Errorf("filepath.Abs(%q): %v", path, err)
			return nil
		}
		if strings.Contains(absPath, filepath.Join("internal", "sse")) {
			return nil
		}
		// Skip generated and test files
		if strings.HasSuffix(path, ".gen.go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		if strings.Contains(string(data), "sse.Event{") {
			t.Errorf("%s: raw sse.Event{} construction found; use a typed constructor (e.g., sse.NewMessageNewEvent) instead", path)
		}
		return nil
	})
	if err != nil {
		t.Fatalf("failed to walk source tree: %v", err)
	}
}
