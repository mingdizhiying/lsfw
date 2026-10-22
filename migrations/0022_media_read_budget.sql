CREATE TABLE IF NOT EXISTS media_read_budget (
 month TEXT PRIMARY KEY,
 baseline INTEGER NOT NULL CHECK(baseline >= 0),
 reads INTEGER NOT NULL DEFAULT 0 CHECK(reads >= 0),
 seeded_at TEXT NOT NULL
);
