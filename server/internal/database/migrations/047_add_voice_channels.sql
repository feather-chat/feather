-- +goose Up
-- +goose NO TRANSACTION

-- Recreate channels table with 'voice' added to type CHECK constraint.
-- Disable FK enforcement so CASCADE doesn't delete related rows during the swap.
PRAGMA foreign_keys = OFF;

CREATE TABLE channels_new (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('public', 'private', 'dm', 'group_dm', 'voice')),
    dm_participant_hash TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO channels_new SELECT id, workspace_id, name, description, type, dm_participant_hash, is_default, archived_at, created_by, created_at, updated_at FROM channels;
DROP TABLE channels;
ALTER TABLE channels_new RENAME TO channels;

-- Recreate indexes
CREATE INDEX idx_channels_workspace ON channels(workspace_id);
CREATE INDEX idx_channels_dm_hash ON channels(workspace_id, dm_participant_hash);
CREATE UNIQUE INDEX idx_channels_workspace_name ON channels(workspace_id, name) WHERE type IN ('public', 'private', 'voice');

PRAGMA foreign_keys = ON;

-- Track active voice participants
CREATE TABLE voice_participants (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_muted INTEGER NOT NULL DEFAULT 0,
    is_deafened INTEGER NOT NULL DEFAULT 0,
    is_server_muted INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL,
    UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_voice_participants_channel ON voice_participants(channel_id);
CREATE INDEX idx_voice_participants_user ON voice_participants(user_id);

-- +goose Down
-- +goose NO TRANSACTION
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS voice_participants;

CREATE TABLE channels_new (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('public', 'private', 'dm', 'group_dm')),
    dm_participant_hash TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO channels_new SELECT id, workspace_id, name, description, type, dm_participant_hash, is_default, archived_at, created_by, created_at, updated_at FROM channels WHERE type != 'voice';
DROP TABLE channels;
ALTER TABLE channels_new RENAME TO channels;

CREATE INDEX idx_channels_workspace ON channels(workspace_id);
CREATE INDEX idx_channels_dm_hash ON channels(workspace_id, dm_participant_hash);
CREATE UNIQUE INDEX idx_channels_workspace_name ON channels(workspace_id, name) WHERE type IN ('public', 'private');

PRAGMA foreign_keys = ON;
