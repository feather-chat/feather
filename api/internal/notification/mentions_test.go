package notification

import (
	"context"
	"testing"
)

// mockResolver implements UserResolver for testing
type mockResolver struct {
	names map[string]string // display name -> user ID
}

func (m *mockResolver) ResolveDisplayNames(_ context.Context, _ string, names []string) (map[string]string, error) {
	result := make(map[string]string)
	for _, name := range names {
		if id, ok := m.names[name]; ok {
			result[name] = id
		}
	}
	return result, nil
}

func TestParseMentions_MrkdwnUserMentions(t *testing.T) {
	ctx := context.Background()

	mentions, err := ParseMentions(ctx, nil, "ws1", "Hello <@user123> and <@user456>!")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mentions) != 2 {
		t.Fatalf("got %d mentions, want 2", len(mentions))
	}
	if mentions[0] != "user123" {
		t.Errorf("mentions[0] = %q, want %q", mentions[0], "user123")
	}
	if mentions[1] != "user456" {
		t.Errorf("mentions[1] = %q, want %q", mentions[1], "user456")
	}
}

func TestParseMentions_MrkdwnUserMentions_Deduplication(t *testing.T) {
	ctx := context.Background()

	mentions, err := ParseMentions(ctx, nil, "ws1", "<@user123> said hello to <@user123>")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mentions) != 1 {
		t.Fatalf("got %d mentions, want 1 (deduplicated)", len(mentions))
	}
	if mentions[0] != "user123" {
		t.Errorf("mentions[0] = %q, want %q", mentions[0], "user123")
	}
}

func TestParseMentions_MrkdwnSpecialMentions(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		content string
		want    string
	}{
		{"here", "<!here> look at this", MentionHere},
		{"channel", "<!channel> announcement", MentionChannel},
		{"everyone", "<!everyone> important", MentionEveryone},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mentions, err := ParseMentions(ctx, nil, "ws1", tt.content)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if len(mentions) != 1 {
				t.Fatalf("got %d mentions, want 1", len(mentions))
			}
			if mentions[0] != tt.want {
				t.Errorf("mentions[0] = %q, want %q", mentions[0], tt.want)
			}
		})
	}
}

func TestParseMentions_MixedMrkdwnAndPlainText(t *testing.T) {
	ctx := context.Background()

	resolver := &mockResolver{
		names: map[string]string{
			"Alice": "alice-id",
		},
	}

	mentions, err := ParseMentions(ctx, resolver, "ws1", "<@user123>, @Alice, <!here>")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mentions) != 3 {
		t.Fatalf("got %d mentions, want 3: %v", len(mentions), mentions)
	}
	if mentions[0] != "user123" {
		t.Errorf("mentions[0] = %q, want %q", mentions[0], "user123")
	}
	if mentions[1] != MentionHere {
		t.Errorf("mentions[1] = %q, want %q", mentions[1], MentionHere)
	}
	if mentions[2] != "alice-id" {
		t.Errorf("mentions[2] = %q, want %q", mentions[2], "alice-id")
	}
}

func TestParseMentions_EmptyContent(t *testing.T) {
	ctx := context.Background()

	mentions, err := ParseMentions(ctx, nil, "ws1", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if mentions != nil {
		t.Errorf("got %v, want nil", mentions)
	}
}

func TestParseMentions_NoMentions(t *testing.T) {
	ctx := context.Background()

	mentions, err := ParseMentions(ctx, nil, "ws1", "just a regular message")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mentions) != 0 {
		t.Errorf("got %d mentions, want 0", len(mentions))
	}
}

func TestParseMentions_PlainTextSpecialMentions(t *testing.T) {
	ctx := context.Background()

	mentions, err := ParseMentions(ctx, nil, "ws1", "@here, @channel, @everyone")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mentions) != 3 {
		t.Fatalf("got %d mentions, want 3", len(mentions))
	}

	seen := make(map[string]bool)
	for _, m := range mentions {
		seen[m] = true
	}
	for _, want := range []string{MentionHere, MentionChannel, MentionEveryone} {
		if !seen[want] {
			t.Errorf("missing mention %q", want)
		}
	}
}

func TestParseMentions_MrkdwnSpecialDeduplicatesWithPlainText(t *testing.T) {
	ctx := context.Background()

	// <!here> in mrkdwn should prevent @here plain text from adding a duplicate
	mentions, err := ParseMentions(ctx, nil, "ws1", "<!here> and also @here")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mentions) != 1 {
		t.Fatalf("got %d mentions, want 1 (deduplicated): %v", len(mentions), mentions)
	}
	if mentions[0] != MentionHere {
		t.Errorf("mentions[0] = %q, want %q", mentions[0], MentionHere)
	}
}
