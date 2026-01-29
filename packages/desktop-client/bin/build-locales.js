#!/usr/bin/env node
/**
 * After running generate:i18n, run this to:
 * - Replace app name "Actual" with "Actual White Label" in locale/en.json (except "Actual field")
 * - Filter locale/pt-BR.json to keys in en.json and replace app name in values
 */

const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '..', 'locale');

function replaceAppName(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\bActual\b/g, 'Actual White Label')
    .replace(/Actual White Label field/g, 'Actual field');
}

// Read en.json (parser output or existing)
const enPath = path.join(localeDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const usedKeys = new Set(Object.keys(en));

// Replace app name in en.json values
const enOut = {};
for (const [key, value] of Object.entries(en)) {
  enOut[key] = replaceAppName(value);
}
fs.writeFileSync(enPath, JSON.stringify(enOut, null, 2) + '\n', 'utf8');
console.log('Updated locale/en.json with app name and', Object.keys(enOut).length, 'keys');

// Filter and update pt-BR.json: only keys from en, replace app name
const ptBrPath = path.join(localeDir, 'pt-BR.json');
if (!fs.existsSync(ptBrPath)) {
  console.warn('locale/pt-BR.json not found, skipping pt-BR');
  process.exit(0);
}

const ptBr = JSON.parse(fs.readFileSync(ptBrPath, 'utf8'));
const ptBrOut = {};
for (const key of usedKeys) {
  const value = ptBr[key];
  ptBrOut[key] =
    value !== undefined
      ? replaceAppName(value)
      : replaceAppName(en[key]);
}
fs.writeFileSync(
  ptBrPath,
  JSON.stringify(ptBrOut, null, 2) + '\n',
  'utf8',
);
console.log('Updated locale/pt-BR.json with', Object.keys(ptBrOut).length, 'keys');
