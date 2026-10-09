ALTER TABLE entries ADD COLUMN project_order TEXT NOT NULL DEFAULT 'desc' CHECK(project_order IN ('asc','desc'));
