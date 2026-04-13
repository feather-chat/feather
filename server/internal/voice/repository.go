package voice

import (
	"context"
	"database/sql"
	"time"

	"github.com/oklog/ulid/v2"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) AddParticipant(ctx context.Context, channelID, userID string) (*Participant, error) {
	p := &Participant{
		ID:        ulid.Make().String(),
		ChannelID: channelID,
		UserID:    userID,
		JoinedAt:  time.Now().UTC(),
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO voice_participants (id, channel_id, user_id, joined_at) VALUES (?, ?, ?, ?)`,
		p.ID, p.ChannelID, p.UserID, p.JoinedAt.Format(time.RFC3339),
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) RemoveParticipant(ctx context.Context, channelID, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM voice_participants WHERE channel_id = ? AND user_id = ?`,
		channelID, userID,
	)
	return err
}

func (r *Repository) GetParticipants(ctx context.Context, channelID string) ([]Participant, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT vp.id, vp.channel_id, vp.user_id, vp.is_muted, vp.is_deafened, vp.is_server_muted, vp.joined_at,
		        u.display_name, u.avatar_url
		 FROM voice_participants vp
		 JOIN users u ON u.id = vp.user_id
		 WHERE vp.channel_id = ?
		 ORDER BY vp.joined_at ASC`,
		channelID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []Participant
	for rows.Next() {
		var p Participant
		var joinedAt string
		if err := rows.Scan(&p.ID, &p.ChannelID, &p.UserID, &p.IsMuted, &p.IsDeafened, &p.IsServerMuted, &joinedAt, &p.DisplayName, &p.AvatarURL); err != nil {
			return nil, err
		}
		p.JoinedAt, _ = time.Parse(time.RFC3339, joinedAt)
		participants = append(participants, p)
	}
	return participants, rows.Err()
}

func (r *Repository) UpdateMuteState(ctx context.Context, channelID, userID string, muted, deafened, serverMuted bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE voice_participants SET is_muted = ?, is_deafened = ?, is_server_muted = ? WHERE channel_id = ? AND user_id = ?`,
		muted, deafened, serverMuted, channelID, userID,
	)
	return err
}

func (r *Repository) RemoveAllParticipants(ctx context.Context, channelID string) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM voice_participants WHERE channel_id = ?`,
		channelID,
	)
	return err
}

func (r *Repository) IsParticipant(ctx context.Context, channelID, userID string) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM voice_participants WHERE channel_id = ? AND user_id = ?`,
		channelID, userID,
	).Scan(&count)
	return count > 0, err
}

func (r *Repository) GetParticipantCount(ctx context.Context, channelID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM voice_participants WHERE channel_id = ?`,
		channelID,
	).Scan(&count)
	return count, err
}

func (r *Repository) GetParticipant(ctx context.Context, channelID, userID string) (*Participant, error) {
	var p Participant
	var joinedAt string
	err := r.db.QueryRowContext(ctx,
		`SELECT id, channel_id, user_id, is_muted, is_deafened, is_server_muted, joined_at
		 FROM voice_participants WHERE channel_id = ? AND user_id = ?`,
		channelID, userID,
	).Scan(&p.ID, &p.ChannelID, &p.UserID, &p.IsMuted, &p.IsDeafened, &p.IsServerMuted, &joinedAt)
	if err != nil {
		return nil, err
	}
	p.JoinedAt, _ = time.Parse(time.RFC3339, joinedAt)
	return &p, nil
}

// RemoveStaleParticipants removes participants that have been connected for longer than maxAge.
// This is used as a cleanup mechanism for participants whose disconnect was not properly handled.
func (r *Repository) RemoveStaleParticipants(ctx context.Context, maxAge time.Duration) (int64, error) {
	cutoff := time.Now().UTC().Add(-maxAge).Format(time.RFC3339)
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM voice_participants WHERE joined_at < ?`,
		cutoff,
	)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
