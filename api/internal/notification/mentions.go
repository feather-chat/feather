package notification

import (
	"context"
	"regexp"
	"strings"
)

// Special mention constants
const (
	MentionChannel  = "@channel"
	MentionHere     = "@here"
	MentionEveryone = "@everyone"
)

// mentionPattern matches @display_name patterns
// Matches @ followed by one or more words (display names can have spaces)
var mentionPattern = regexp.MustCompile(`@([A-Za-z][A-Za-z0-9 ]*[A-Za-z0-9]|[A-Za-z])`)

// UserResolver resolves display names to user IDs within a workspace
type UserResolver interface {
	ResolveDisplayNames(ctx context.Context, workspaceID string, names []string) (map[string]string, error)
}

// ParseMentions extracts and resolves mentions from message content.
// Returns a list of user IDs and special mention strings (@channel, @here, @everyone).
// Invalid mentions are silently ignored.
func ParseMentions(ctx context.Context, resolver UserResolver, workspaceID, content string) ([]string, error) {
	if content == "" {
		return nil, nil
	}

	// Find all potential mentions
	matches := mentionPattern.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		return nil, nil
	}

	var mentions []string
	var displayNames []string
	seenSpecial := make(map[string]bool)

	for _, match := range matches {
		if len(match) < 2 {
			continue
		}

		name := strings.TrimSpace(match[1])
		lowerName := strings.ToLower(name)

		// Check for special mentions
		switch lowerName {
		case "channel":
			if !seenSpecial[MentionChannel] {
				mentions = append(mentions, MentionChannel)
				seenSpecial[MentionChannel] = true
			}
		case "here":
			if !seenSpecial[MentionHere] {
				mentions = append(mentions, MentionHere)
				seenSpecial[MentionHere] = true
			}
		case "everyone":
			if !seenSpecial[MentionEveryone] {
				mentions = append(mentions, MentionEveryone)
				seenSpecial[MentionEveryone] = true
			}
		default:
			// This could be a user display name
			displayNames = append(displayNames, name)
		}
	}

	// Resolve display names to user IDs
	if len(displayNames) > 0 && resolver != nil {
		resolved, err := resolver.ResolveDisplayNames(ctx, workspaceID, displayNames)
		if err != nil {
			// Don't fail on resolution errors, just skip unresolved mentions
			resolved = make(map[string]string)
		}

		seenUsers := make(map[string]bool)
		for _, name := range displayNames {
			// Try exact match first, then case-insensitive
			if userID, ok := resolved[name]; ok && !seenUsers[userID] {
				mentions = append(mentions, userID)
				seenUsers[userID] = true
			} else if userID, ok := resolved[strings.ToLower(name)]; ok && !seenUsers[userID] {
				mentions = append(mentions, userID)
				seenUsers[userID] = true
			}
		}
	}

	return mentions, nil
}

// IsSpecialMention returns true if the mention is @channel, @here, or @everyone
func IsSpecialMention(mention string) bool {
	return mention == MentionChannel || mention == MentionHere || mention == MentionEveryone
}
