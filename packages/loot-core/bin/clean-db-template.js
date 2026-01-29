#!/usr/bin/env node
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Source database from original repo (should be cloned at same level as actual-white-label)
const sourceDb = path.join(__dirname, '..', '..', '..', '..', 'actual-original', 'packages', 'loot-core', 'default-db.sqlite');

if (!fs.existsSync(sourceDb)) {
  console.error('Source database not found:', sourceDb);
  process.exit(1);
}

console.log('Opening source database:', sourceDb);
const source = new Database(sourceDb, { readonly: true });

// Get all tables
console.log('\nTables in original database:');
const tables = source.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log('  -', t.name));

// Tables to keep (white-label core tables)
const keepTables = [
  'messages_crdt',
  'messages_clock',
  '__migrations__',
  '__meta__',
  'rules',
  'preferences',
  'kvcache',
  'kvcache_key',
];

// Tables to drop (budget-specific)
const tablesToDrop = tables
  .map(t => t.name)
  .filter(name => !keepTables.includes(name) && !name.startsWith('sqlite_'));

console.log('\nTables to drop:', tablesToDrop);

// Create a new clean database
const outputDb = path.join(__dirname, '..', 'default-db.sqlite');
if (fs.existsSync(outputDb)) {
  fs.unlinkSync(outputDb);
}

console.log('\nCreating clean database:', outputDb);
const db = new Database(outputDb);

// Copy schema for tables we want to keep
console.log('\nCopying schema for kept tables...');
for (const tableName of keepTables) {
  const tableInfo = source.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
  if (tableInfo) {
    console.log(`  Creating table: ${tableName}`);
    db.exec(tableInfo.sql);
  } else {
    console.log(`  Table ${tableName} not found in source (will be created from init.sql)`);
  }
}

// Add missing tables from our init.sql schema
console.log('\nAdding white-label specific tables...');
const initSqlPath = path.join(__dirname, '..', 'migrations', 'init.sql');
if (fs.existsSync(initSqlPath)) {
  const initSql = fs.readFileSync(initSqlPath, 'utf8');
  // Extract CREATE TABLE statements for tables that don't exist yet
  const createTableRegex = /CREATE TABLE\s+(\w+)[^;]*;/gi;
  let match;
  while ((match = createTableRegex.exec(initSql)) !== null) {
    const tableName = match[1];
    // Check if table already exists
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    if (!exists && keepTables.includes(tableName)) {
      console.log(`  Creating table from init.sql: ${tableName}`);
      db.exec(match[0]);
    }
  }
} else {
  console.log('  Warning: init.sql not found, creating tables manually...');
  // Manually create the missing tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS __meta__ (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      stage TEXT,
      conditions_op TEXT DEFAULT 'and',
      conditions TEXT,
      actions TEXT,
      tombstone INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS kvcache (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS kvcache_key (id INTEGER PRIMARY KEY, key REAL);
  `);
}

// Copy any views (they might reference dropped tables, so we'll handle them separately)
const views = source.prepare("SELECT name, sql FROM sqlite_master WHERE type='view'").all();
console.log(`\nFound ${views.length} views (will be skipped for now)`);

// Clean up __migrations__ table (remove all migration records)
// New databases should start fresh with migrations
console.log('\nCleaning up __migrations__ table...');
db.exec('DELETE FROM __migrations__');

// Note: We don't change journal mode - the original database works as-is
// The web platform's openDatabase() will set MEMORY mode when opening databases

// Verify final state
console.log('\nFinal tables in clean database:');
const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
finalTables.forEach(t => console.log('  -', t.name));

db.close();
source.close();

console.log('\n✅ Clean database created:', outputDb);
console.log('Copying to db.sqlite...');
fs.copyFileSync(outputDb, path.join(__dirname, '..', 'db.sqlite'));
console.log('✅ Done!');
