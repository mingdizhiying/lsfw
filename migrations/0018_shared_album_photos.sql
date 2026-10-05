CREATE TABLE album_media(album_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,caption TEXT NOT NULL DEFAULT '',position INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,PRIMARY KEY(album_id,media_id));
CREATE INDEX album_media_by_photo ON album_media(media_id);
INSERT INTO album_media(album_id,media_id,caption,position,created_at) SELECT m.entry_id,m.id,m.caption,m.position,m.created_at FROM media m JOIN entries e ON e.id=m.entry_id WHERE e.kind='album';
