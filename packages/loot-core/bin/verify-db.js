#!/usr/bin/env node
const Database = require('better-sqlite3');

const db = new Database('default-db.sqlite');
console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(t => t.name));
console.log('Migrations count:', db.prepare('SELECT COUNT(*) as count FROM __migrations__').get().count);
const journalMode = db.prepare('PRAGMA journal_mode').get();
console.log('Journal mode:', journalMode ? Object.values(journalMode)[0] : 'unknown');
db.close();
