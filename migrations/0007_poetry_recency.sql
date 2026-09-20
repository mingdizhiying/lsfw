ALTER TABLE poetry_books ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
UPDATE poetry_books SET updated_at=created_at;
