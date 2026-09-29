CREATE TABLE anime_yearbooks (year INTEGER PRIMARY KEY, url TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', items_json TEXT NOT NULL DEFAULT '[]', synced_at TEXT, next_sync INTEGER NOT NULL DEFAULT 0, last_error TEXT NOT NULL DEFAULT '');
INSERT INTO anime_yearbooks(year,url) VALUES(2025,'https://bgm.tv/index/85378'),(2026,'https://bgm.tv/index/87023');
