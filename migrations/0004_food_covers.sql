ALTER TABLE poetry_books ADD COLUMN cover TEXT NOT NULL DEFAULT '';
ALTER TABLE poetry_books ADD COLUMN date TEXT NOT NULL DEFAULT '';
UPDATE poetry_books SET date=substr(created_at,1,10) WHERE date='';
CREATE TABLE food_records (id TEXT PRIMARY KEY,title TEXT NOT NULL,province TEXT NOT NULL,city TEXT NOT NULL,address TEXT NOT NULL DEFAULT '',rating REAL NOT NULL CHECK(rating>=0 AND rating<=5),body TEXT NOT NULL DEFAULT '',date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',updated_at TEXT NOT NULL);
CREATE INDEX food_location ON food_records(status,province,city,date);
