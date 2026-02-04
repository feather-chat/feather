-- +goose Up
-- SQLite doesn't support DROP COLUMN, so we need to recreate the table
-- Disable foreign keys to prevent CASCADE deletes during table recreation
PRAGMA foreign_keys = OFF;

CREATE TABLE workspaces_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon_url TEXT,
    settings TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO workspaces_new (id, name, icon_url, settings, created_at, updated_at)
SELECT id, name, icon_url, settings, created_at, updated_at FROM workspaces;

DROP TABLE workspaces;

ALTER TABLE workspaces_new RENAME TO workspaces;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- +goose Down
-- Note: We can't restore slug values since they're lost
CREATE TABLE workspaces_new (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon_url TEXT,
    settings TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO workspaces_new (id, slug, name, icon_url, settings, created_at, updated_at)
SELECT id, id, name, icon_url, settings, created_at, updated_at FROM workspaces;

DROP TABLE workspaces;

ALTER TABLE workspaces_new RENAME TO workspaces;

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
