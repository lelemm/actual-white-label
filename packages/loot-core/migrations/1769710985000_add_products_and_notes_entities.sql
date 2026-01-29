BEGIN TRANSACTION;

-- Dummy entities for white-label example
-- Entity 1: Products - a simple entity with basic fields
CREATE TABLE products
  (id TEXT PRIMARY KEY,
   name TEXT NOT NULL,
   description TEXT,
   price REAL,
   category TEXT,
   created_date TEXT,
   tombstone INTEGER DEFAULT 0);

-- Entity 2: Notes - an entity with in-place editing capability
CREATE TABLE notes
  (id TEXT PRIMARY KEY,
   title TEXT NOT NULL,
   content TEXT,
   priority TEXT,
   status TEXT,
   created_date TEXT,
   updated_date TEXT,
   tombstone INTEGER DEFAULT 0);

COMMIT;
