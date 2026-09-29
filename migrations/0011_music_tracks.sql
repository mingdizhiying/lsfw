CREATE TABLE IF NOT EXISTS music_tracks (
 id TEXT PRIMARY KEY,
 title TEXT NOT NULL,
 artist TEXT NOT NULL DEFAULT '',
 album TEXT NOT NULL DEFAULT '',
 cover TEXT NOT NULL DEFAULT '',
 review TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 updated_at TEXT NOT NULL
);
