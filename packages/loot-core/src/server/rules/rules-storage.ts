// @ts-strict-ignore
// White-label version: Simple rules storage without transaction-specific logic
import * as db from '../db';
import { type RuleEntity } from '../../types/models';

import { Rule } from './rule';

let rulesCache: Rule[] | null = null;

async function loadRules(): Promise<Rule[]> {
  if (rulesCache) {
    return rulesCache;
  }

  const rows = await db.all<RuleEntity & { entity_type?: string }>(
    'SELECT * FROM rules WHERE tombstone = 0',
  );
  rulesCache = rows.map(row => {
    // Map entity_type column to entityType property
    const ruleData = {
      ...row,
      entityType: row.entity_type || row.entityType || '',
    };
    return new Rule(ruleData);
  });
  return rulesCache;
}

export async function getRules(): Promise<Rule[]> {
  return loadRules();
}

export async function insertRule(rule: Omit<RuleEntity, 'id'>): Promise<string> {
  // Map entityType to entity_type for database
  const dbRule = {
    ...rule,
    entity_type: rule.entityType || '',
  };
  const { entityType, ...ruleWithoutEntityType } = dbRule as any;
  const id = await db.insertWithUUID('rules', ruleWithoutEntityType);
  rulesCache = null; // Invalidate cache
  return id;
}

export async function updateRule(rule: RuleEntity): Promise<void> {
  // Map entityType to entity_type for database
  const dbRule = {
    ...rule,
    entity_type: rule.entityType || '',
  };
  const { entityType, ...ruleWithoutEntityType } = dbRule as any;
  await db.update('rules', { ...ruleWithoutEntityType, id: rule.id });
  rulesCache = null; // Invalidate cache
}

export async function deleteRule(id: string): Promise<boolean> {
  await db.update('rules', { id, tombstone: 1 });
  rulesCache = null; // Invalidate cache
  return true;
}

export function updatePayeeRenameRule(
  fromNames: string[],
  to: string,
): Promise<string> {
  // Payee rename rules removed for white-label version
  // Return empty string as placeholder
  return Promise.resolve('');
}

export function applyActions(
  transactions: unknown[],
  actions: unknown[],
): Promise<null> {
  // Transaction-specific action application removed for white-label version
  return Promise.resolve(null);
}

export function runRules(transaction: unknown): Promise<unknown> {
  // Transaction-specific rule running removed for white-label version
  return Promise.resolve(transaction);
}
