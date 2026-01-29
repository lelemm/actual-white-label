// @ts-strict-ignore
import { type Database } from '@jlongster/sql.js';

import { captureBreadcrumb } from '../platform/exceptions';
import { logger } from '../platform/server/log';
import * as sqlite from '../platform/server/sqlite';
import { sheetForMonth } from '../shared/months';
import * as Platform from '../shared/platform';

import type * as DbModule from './db';
import {
  type DbPreference,
} from './db';
import { Spreadsheet } from './spreadsheet/spreadsheet';
import { resolveName } from './spreadsheet/util';

let globalSheet: Spreadsheet;
let globalOnChange;
let globalCacheDb;

export function get(): Spreadsheet {
  return globalSheet;
}

async function updateSpreadsheetCache(rawDb, names: string[]) {
  await sqlite.transaction(rawDb, () => {
    names.forEach(name => {
      const node = globalSheet._getNode(name);

      // Don't cache query nodes yet
      if (node.sql == null) {
        sqlite.runQuery(
          rawDb,
          'INSERT OR REPLACE INTO kvcache (key, value) VALUES (?, ?)',
          [name, JSON.stringify(node.value)],
        );
      }
    });
  });
}

function setCacheStatus(
  mainDb: Database,
  cacheDb: Database,
  { clean }: { clean: boolean },
) {
  if (clean) {
    // Generate random number and stick in both places
    const num = Math.random() * 10000000;
    sqlite.runQuery(
      cacheDb,
      'INSERT OR REPLACE INTO kvcache_key (id, key) VALUES (1, ?)',
      [num],
    );

    if (mainDb) {
      sqlite.runQuery(
        mainDb,
        'INSERT OR REPLACE INTO kvcache_key (id, key) VALUES (1, ?)',
        [num],
      );
    }
  } else {
    sqlite.runQuery(cacheDb, 'DELETE FROM kvcache_key');
  }
}

function isCacheDirty(mainDb: Database, cacheDb: Database): boolean {
  let rows = sqlite.runQuery<{ key?: number }>(
    cacheDb,
    'SELECT key FROM kvcache_key WHERE id = 1',
    [],
    true,
  );
  const num = rows.length === 0 ? null : rows[0].key;

  if (num == null) {
    return true;
  }

  if (mainDb) {
    const rows = sqlite.runQuery<{ key?: number }>(
      mainDb,
      'SELECT key FROM kvcache_key WHERE id = 1',
      [],
      true,
    );
    if (rows.length === 0 || rows[0].key !== num) {
      return true;
    }
  }

  // Always also check if there is anything in `kvcache`. We ask for one item;
  // if we didn't get back anything it's empty so there is no cache
  rows = sqlite.runQuery(cacheDb, 'SELECT * FROM kvcache LIMIT 1', [], true);
  return rows.length === 0;
}

export async function loadSpreadsheet(
  db,
  onSheetChange?,
): Promise<Spreadsheet> {
  const cacheEnabled = process.env.NODE_ENV !== 'test';
  const mainDb = db.getDatabase();
  let cacheDb;

  if (!Platform.isBrowser && cacheEnabled) {
    // Desktop apps use a separate database for the cache. This is because it is
    // much more likely to directly work with files on desktop, and this makes
    // it a lot clearer what the true filesize of the main db is (and avoid
    // copying the cache data around).
    const cachePath = db
      .getDatabasePath()
      .replace(/db\.sqlite$/, 'cache.sqlite');
    globalCacheDb = cacheDb = sqlite.openDatabase(cachePath);

    sqlite.execQuery(
      cacheDb,
      `
        CREATE TABLE IF NOT EXISTS kvcache (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS kvcache_key (id INTEGER PRIMARY KEY, key REAL)
      `,
    );
  } else {
    // All other platforms use the same database for cache
    cacheDb = mainDb;
  }

  let sheet;
  if (cacheEnabled) {
    sheet = new Spreadsheet(
      updateSpreadsheetCache.bind(null, cacheDb),
      setCacheStatus.bind(null, mainDb, cacheDb),
    );
  } else {
    sheet = new Spreadsheet();
  }

  captureBreadcrumb({
    message: 'loading spreadsheet',
    category: 'server',
  });

  globalSheet = sheet;
  globalOnChange = onSheetChange;

  if (onSheetChange) {
    sheet.addEventListener('change', onSheetChange);
  }

  if (cacheEnabled && !isCacheDirty(mainDb, cacheDb)) {
    const cachedRows = await sqlite.runQuery<{ key?: number; value: string }>(
      cacheDb,
      'SELECT * FROM kvcache',
      [],
      true,
    );
    logger.log(`Loaded spreadsheet from cache (${cachedRows.length} items)`);

    for (const row of cachedRows) {
      const parsed = JSON.parse(row.value);
      sheet.load(row.key, parsed);
    }
  } else {
    logger.log('Loading fresh spreadsheet');
    // White-label version: Budget loading removed
    // Entity-specific data loading should be handled by entity type handlers
  }

  captureBreadcrumb({
    message: 'loaded spreadsheet',
    category: 'server',
  });

  return sheet;
}

export function unloadSpreadsheet(): void {
  if (globalSheet) {
    // TODO: Should wait for the sheet to finish
    globalSheet.unload();
    globalSheet = null;
  }

  if (globalCacheDb) {
    sqlite.closeDatabase(globalCacheDb);
    globalCacheDb = null;
  }
}

export async function reloadSpreadsheet(db): Promise<Spreadsheet> {
  if (globalSheet) {
    unloadSpreadsheet();
    return loadSpreadsheet(db, globalOnChange);
  }
}

// White-label version: loadUserBudgets removed
// Budget-specific functionality removed. Entity-specific data loading
// should be handled by entity type handlers if needed.

export function getCell(sheet: string, name: string) {
  return globalSheet._getNode(resolveName(sheet, name));
}

export function getCellValue(
  sheet: string,
  name: string,
): string | number | boolean {
  return globalSheet.getValue(resolveName(sheet, name));
}

export function startTransaction(): void {
  if (globalSheet) {
    globalSheet.startTransaction();
  }
}

export function endTransaction(): void {
  if (globalSheet) {
    globalSheet.endTransaction();
  }
}

export function waitOnSpreadsheet(): Promise<void> {
  return new Promise(resolve => {
    if (globalSheet) {
      globalSheet.onFinish(resolve);
    } else {
      resolve(undefined);
    }
  });
}
