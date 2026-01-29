// @ts-strict-ignore
import md5 from 'md5';

import * as fs from '../platform/server/fs';
import * as sqlite from '../platform/server/sqlite';
import { makeViews, schema, schemaConfig } from './aql';
import * as db from './db';
import * as migrations from './migrate/migrations';

// Managing the init/update process

async function runMigrations() {
  const database = db.getDatabase();
  
  // Check if database needs initialization (check if __meta__ table exists)
  // This is the key table that indicates the database has been initialized
  let needsInit = false;
  try {
    const tables = await sqlite.runQuery<{ name: string }>(
      database,
      "SELECT name FROM sqlite_master WHERE type='table' AND name='__meta__'",
      [],
      true,
    );
    needsInit = tables.length === 0;
  } catch (e) {
    // If query fails, database might be empty - initialize it
    needsInit = true;
  }
  
  if (needsInit) {
    // Run init.sql for new databases
    // Use CREATE TABLE IF NOT EXISTS to avoid errors if tables already exist
    // (in case database is in a partial state)
    const initSqlPath = fs.join(fs.migrationsPath, 'init.sql');
    try {
      let initSql = await fs.readFile(initSqlPath, 'utf8');
      
      // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS to be safe
      // This handles cases where database might have some tables but not __meta__
      // Handle both single-line and multi-line CREATE TABLE statements
      initSql = initSql.replace(
        /CREATE TABLE\s+(\w+)/gi,
        'CREATE TABLE IF NOT EXISTS $1',
      );
      
      await sqlite.execQuery(database, initSql);
    } catch (e) {
      // If init.sql fails, check if it's because tables already exist
      // If so, that's ok - database might be partially initialized
      if (!e.message || !e.message.includes('already exists')) {
        throw new Error(
          `Failed to initialize database with init.sql: ${e.message}`,
        );
      }
      // If tables already exist, continue - migrations will handle the rest
    }
  }
  
  // Run regular migrations
  await migrations.migrate(database);
}

async function updateViews() {
  const hashKey = 'view-hash';
  const row = await db.first<{ value: string }>(
    'SELECT value FROM __meta__ WHERE key = ?',
    [hashKey],
  );
  const { value: hash } = row || {};

  const views = makeViews(schema, schemaConfig);
  const currentHash = md5(views);

  if (hash !== currentHash) {
    await db.execQuery(views);
    await db.runQuery(
      'INSERT OR REPLACE INTO __meta__ (key, value) VALUES (?, ?)',
      [hashKey, currentHash],
    );
  }
}

export async function updateVersion() {
  await runMigrations();
  await updateViews();
}
