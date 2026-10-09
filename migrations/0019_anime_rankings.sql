CREATE TABLE anime_rankings (year INTEGER PRIMARY KEY, url TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', items_json TEXT NOT NULL DEFAULT '[]', synced_at TEXT, next_sync INTEGER NOT NULL DEFAULT 0, last_error TEXT NOT NULL DEFAULT '');
INSERT INTO anime_rankings(year,url) VALUES(2025,'https://bgm.tv/index/82655');
