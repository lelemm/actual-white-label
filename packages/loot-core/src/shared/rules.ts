// @ts-strict-ignore
import { t } from 'i18next';

import { type FieldValueTypes, type RuleConditionOp } from '../types/models';

// For now, this info is duplicated from the backend. Figure out how
// to share it later.
const TYPE_INFO = {
  date: {
    ops: ['is', 'isapprox', 'gt', 'gte', 'lt', 'lte'],
    nullable: false,
  },
  id: {
    ops: [
      'is',
      'contains',
      'matches',
      'oneOf',
      'isNot',
      'doesNotContain',
      'notOneOf',
    ],
    nullable: true,
  },
  saved: {
    ops: [],
    nullable: false,
  },
  string: {
    ops: [
      'is',
      'contains',
      'matches',
      'oneOf',
      'isNot',
      'doesNotContain',
      'notOneOf',
    ],
    nullable: true,
  },
  number: {
    ops: ['is', 'isapprox', 'isbetween', 'gt', 'gte', 'lt', 'lte'],
    nullable: false,
  },
  boolean: {
    ops: ['is'],
    nullable: false,
  },
} as const;

type FieldInfoConstraint = Partial<Record<
  keyof FieldValueTypes,
  {
    type: keyof typeof TYPE_INFO;
    disallowedOps?: Set<RuleConditionOp>;
    internalOps?: Set<RuleConditionOp | 'and'>;
  }
>>;

// Generic field definitions - now entity-type aware
// Removed specific filters: hasTags, reconciled, cleared, transfer, parent, saved
// Fields are now determined dynamically based on entity type registration

import { entityTypeRegistry, type EntityTypeDefinition } from '../types/rules-entity';

/**
 * Get field definitions for an entity type
 */
export function getFieldsForEntityType(
  entityType: string,
): Record<string, { type: string; disallowedOps?: Set<string> }> | undefined {
  return entityTypeRegistry.getFields(entityType);
}

/**
 * Get field type for a specific field in an entity type
 */
export function getFieldType(
  entityType: string,
  field: string,
): string | undefined {
  const fields = getFieldsForEntityType(entityType);
  return fields?.[field]?.type;
}

/**
 * Legacy FIELD_TYPES map for backward compatibility
 * Use getFieldType(entityType, field) instead when entity type is known
 */
export const FIELD_TYPES = new Map<string, string>([
  ['date', 'date'],
  ['notes', 'string'],
  ['amount', 'number'],
  ['cleared', 'boolean'],
  ['reconciled', 'boolean'],
  ['saved', 'saved'],
  ['transfer', 'boolean'],
  ['parent', 'boolean'],
]);

/**
 * Check if an operation is valid for a field in an entity type
 */
export function isValidOp(
  entityType: string,
  field: string,
  op: RuleConditionOp,
): boolean {
  const fields = getFieldsForEntityType(entityType);
  if (!fields || !fields[field]) return false;

  const fieldDef = fields[field];
  const type = fieldDef.type as keyof typeof TYPE_INFO;

  if (!TYPE_INFO[type]) return false;
  if (fieldDef.disallowedOps?.has(op)) return false;

  return (TYPE_INFO[type].ops as readonly string[]).includes(op);
}

/**
 * Backward compatibility: Check if op is valid without entity type (legacy mode)
 * This is deprecated - use isValidOp(entityType, field, op) instead
 */
export function isValidOpLegacy(field: string, op: RuleConditionOp): boolean {
  const ops = getValidOpsLegacy(field);
  return ops.includes(op);
}

/**
 * Get valid operations for a field in an entity type
 */
export function getValidOps(
  entityType: string,
  field: string,
): RuleConditionOp[] {
  const fields = getFieldsForEntityType(entityType);
  if (!fields || !fields[field]) return [];

  const fieldDef = fields[field];
  const type = fieldDef.type as keyof typeof TYPE_INFO;

  if (!TYPE_INFO[type]) return [];

  return (TYPE_INFO[type].ops.filter(
    op => !fieldDef.disallowedOps?.has(op),
  ) as RuleConditionOp[]);
}

/**
 * Backward compatibility: Get valid ops without entity type (legacy mode)
 * This is deprecated - use getValidOps(entityType, field) instead
 */
export function getValidOpsLegacy(field: string): RuleConditionOp[] {
  // Try to infer type from field name (legacy behavior)
  if (field === 'date') return ['is', 'isapprox', 'gt', 'gte', 'lt', 'lte'] as RuleConditionOp[];
  if (field === 'amount') return ['is', 'isapprox', 'isbetween', 'gt', 'gte', 'lt', 'lte'] as RuleConditionOp[];
  if (field === 'notes') return ['is', 'isNot', 'contains', 'matches', 'doesNotContain'] as RuleConditionOp[];
  return [];
}

export function getAllocationMethods() {
  return {
    'fixed-amount': t('a fixed amount'),
    'fixed-percent': t('a fixed percent of the remainder'),
    remainder: t('an equal portion of the remainder'),
  };
}

export function mapField(field, opts?) {
  opts = opts || {};

  switch (field) {
    case 'amount':
      if (opts.inflow) {
        return t('amount (inflow)');
      } else if (opts.outflow) {
        return t('amount (outflow)');
      }
      return t('amount');
    case 'amount-inflow':
      return t('amount (inflow)');
    case 'amount-outflow':
      return t('amount (outflow)');
    case 'date':
      return t('date');
    case 'notes':
      return t('notes');
    // Removed specific filters: saved, cleared, reconciled, transfer
    default:
      return field;
  }
}

export function friendlyOp(op, type?) {
  switch (op) {
    case 'oneOf':
      return t('one of');
    case 'notOneOf':
      return t('not one of');
    case 'is':
      return t('is');
    case 'isNot':
      return t('is not');
    case 'isapprox':
      return t('is approx');
    case 'isbetween':
      return t('is between');
    case 'contains':
      return t('contains');
    // hasTags removed for white-label version
    case 'matches':
      return t('matches');
    case 'doesNotContain':
      return t('does not contain');
    case 'gt':
      if (type === 'date') {
        return t('is after');
      }
      return t('is greater than');
    case 'gte':
      if (type === 'date') {
        return t('is after or equals');
      }
      return t('is greater than or equals');
    case 'lt':
      if (type === 'date') {
        return t('is before');
      }
      return t('is less than');
    case 'lte':
      if (type === 'date') {
        return t('is before or equals');
      }
      return t('is less than or equals');
    case 'true':
      return t('is true');
    case 'false':
      return t('is false');
    case 'set':
      return t('set');
    case 'set-split-amount':
      return t('allocate');
    case 'link-schedule':
      return t('link schedule');
    case 'prepend-notes':
      return t('prepend to notes');
    case 'append-notes':
      return t('append to notes');
    case 'and':
      return t('and');
    case 'or':
      return t('or');
    // Budget-specific operators removed for white-label version
    case 'delete-entity':
      return t('delete entity');
    default:
      return '';
  }
}

export function translateRuleStage(stage: string): string {
  switch (stage) {
    case 'pre':
      return t('Pre');
    case 'post':
      return t('Post');
    default:
      return '';
  }
}

export function deserializeField(field) {
  if (field === 'amount-inflow') {
    return { field: 'amount', options: { inflow: true } };
  } else if (field === 'amount-outflow') {
    return { field: 'amount', options: { outflow: true } };
  } else {
    return { field };
  }
}

export function getFieldError(type) {
  switch (type) {
    case 'date-format':
      return 'Invalid date format';
    case 'no-null':
    case 'no-empty-array':
    case 'no-empty-string':
      return 'Value cannot be empty';
    case 'not-string':
      return 'Value must be a string';
    case 'not-boolean':
      return 'Value must be a boolean';
    case 'not-number':
      return 'Value must be a number';
    case 'invalid-field':
      return 'Please choose a valid field for this type of rule';
    case 'invalid-template':
      return 'Invalid handlebars template';
    default:
      return 'Internal error, sorry! Please get in touch https://actualbudget.org/contact/ for support';
  }
}

export function sortNumbers(num1, num2) {
  if (num1 < num2) {
    return [num1, num2];
  }
  return [num2, num1];
}

export function parse(item) {
  if (item.op === 'set-split-amount') {
    if (item.options.method === 'fixed-amount') {
      return { ...item };
    }
    return item;
  }

  switch (item.type) {
    case 'number': {
      return { ...item };
    }
    case 'string': {
      const parsed = item.value == null ? '' : item.value;
      return { ...item, value: parsed };
    }
    case 'boolean': {
      const parsed = item.value;
      return { ...item, value: parsed };
    }
    default:
  }

  return { ...item, error: null };
}

export function unparse({ error: _error, inputKey: _inputKey, ...item }) {
  if (item.op === 'set-split-amount') {
    if (item.options.method === 'fixed-amount') {
      return {
        ...item,
      };
    }
    if (item.options.method === 'fixed-percent') {
      return {
        ...item,
        value: item.value && parseFloat(item.value),
      };
    }
    return item;
  }

  switch (item.type) {
    case 'number': {
      return { ...item };
    }
    case 'string': {
      const unparsed = item.value == null ? '' : item.value;
      return { ...item, value: unparsed };
    }
    case 'boolean': {
      const unparsed = item.value == null ? false : item.value;
      return { ...item, value: unparsed };
    }
    default:
  }

  return item;
}

export function makeValue(value, cond) {
  const isMulti = ['oneOf', 'notOneOf'].includes(cond.op);

  if (isMulti) {
    return { ...cond, error: null, value: value || [] };
  }

  if (cond.type === 'number' && value == null) {
    return { ...cond, error: null, value: 0 };
  }

  return { ...cond, error: null, value };
}

export function getApproxNumberThreshold(number) {
  return Math.round(Math.abs(number) * 0.075);
}
