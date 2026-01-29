-- White-label core database schema
-- This is the initial schema for new database files
-- All budget-specific tables have been removed

-- CRDT synchronization tables
CREATE TABLE messages_crdt
 (id INTEGER PRIMARY KEY,
  timestamp TEXT NOT NULL UNIQUE,
  dataset TEXT NOT NULL,
  row TEXT NOT NULL,
  column TEXT NOT NULL,
  value BLOB NOT NULL);

CREATE TABLE messages_clock (id INTEGER PRIMARY KEY, clock TEXT);

-- Migration tracking
CREATE TABLE __migrations__ (id INT PRIMARY KEY NOT NULL);

-- Metadata storage
CREATE TABLE __meta__ (key TEXT PRIMARY KEY, value TEXT);

-- Generic rules engine with entity type support
CREATE TABLE rules
  (id TEXT PRIMARY KEY,
   entity_type TEXT NOT NULL,
   stage TEXT,
   conditions_op TEXT DEFAULT 'and',
   conditions TEXT,
   actions TEXT,
   tombstone INTEGER DEFAULT 0);

-- Synced preferences
CREATE TABLE preferences
   (id TEXT PRIMARY KEY,
    value TEXT);

-- Spreadsheet cache tables (used for caching spreadsheet calculations)
CREATE TABLE kvcache (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE kvcache_key (id INTEGER PRIMARY KEY, key REAL);
