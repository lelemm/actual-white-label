# Generic Rules Entity System

## Overview

The rules system has been refactored to be generic and entity-type aware. Rules can now operate on any white-label entity type as long as the entity implements the `RuleTarget` interface and the entity type is registered.

## Key Changes

### 1. Generic Interface (`RuleTarget`)

All entities that rules operate on must implement the `RuleTarget` interface:

```typescript
interface RuleTarget {
  id: string;
  date?: string;
  notes?: string;
  amount?: number;
  [key: string]: unknown; // Any additional fields
}
```

### 2. Entity Type Registration

Entity types must be registered before rules can use them:

```typescript
import { entityTypeRegistry } from 'loot-core/types/rules-entity';

entityTypeRegistry.register({
  id: 'patient',
  displayName: 'Patient',
  defaultFields: {
    date: true,
    notes: true,
    amount: true,
  },
  fields: {
    name: {
      type: 'string',
      required: true,
      displayName: 'Name',
    },
    age: {
      type: 'number',
      displayName: 'Age',
    },
  },
});
```

### 3. Entity Type Selection in Rules

Rules now include an `entityType` field that specifies which entity type the rule applies to:

```typescript
const rule: RuleEntity = {
  id: 'rule-1',
  entityType: 'patient', // Required: specifies entity type
  stage: 'pre',
  conditionsOp: 'and',
  conditions: [
    { field: 'age', op: 'gt', value: 18 },
  ],
  actions: [
    { field: 'notes', op: 'set', value: 'Adult patient' },
  ],
};
```

### 4. Dynamic Field Validation

Fields are now validated dynamically based on the entity type:

- Fields are checked against the registered entity type definition
- Only fields defined for the entity type can be used in conditions/actions
- Field types determine which operations are valid

### 5. Removed Specific Filters

The following budget-specific filters have been removed:
- `hasTags` - removed from string operations
- `reconciled` - removed as a field
- `cleared` - removed as a field
- `transfer` - removed as a field
- `parent` - removed as a field
- `saved` - removed as a field

These were specific to budget/transaction entities and are not needed in a generic system.

## Usage Example

### 1. Register Entity Types

```typescript
import { entityTypeRegistry } from 'loot-core/types/rules-entity';

// Register your entity types at application startup
entityTypeRegistry.register({
  id: 'appointment',
  displayName: 'Appointment',
  defaultFields: {
    date: true,
    notes: true,
  },
  fields: {
    patientId: {
      type: 'id',
      required: true,
      displayName: 'Patient',
    },
    duration: {
      type: 'number',
      displayName: 'Duration (minutes)',
    },
  },
});
```

### 2. Create Rules for Entity Types

```typescript
import { send } from 'loot-core/platform/client/fetch';

// Create a rule for appointments
const ruleId = await send('rule-add', {
  entityType: 'appointment',
  stage: 'pre',
  conditionsOp: 'and',
  conditions: [
    { field: 'duration', op: 'gt', value: 60 },
  ],
  actions: [
    { field: 'notes', op: 'set', value: 'Long appointment' },
  ],
});
```

### 3. Apply Rules to Entities

```typescript
import { Rule } from 'loot-core/server/rules';

// Get rules for a specific entity type
const rules = await getRules();
const appointmentRules = rules.filter(r => r.entityType === 'appointment');

// Apply rules to an entity
const appointment = {
  id: 'apt-1',
  date: '2026-01-30',
  duration: 90,
  notes: '',
};

for (const rule of appointmentRules) {
  const changes = rule.exec(appointment);
  if (changes) {
    Object.assign(appointment, changes);
  }
}
```

## Field Types

Supported field types:
- `date` - Date fields (operations: is, isapprox, gt, gte, lt, lte)
- `string` - Text fields (operations: is, isNot, contains, matches, oneOf, notOneOf, doesNotContain)
- `number` - Numeric fields (operations: is, isapprox, isbetween, gt, gte, lt, lte)
- `boolean` - Boolean fields (operations: is)
- `id` - ID/reference fields (operations: is, contains, matches, oneOf, isNot, doesNotContain, notOneOf)

## Database Schema

The `rules` table now includes an `entity_type` column:

```sql
CREATE TABLE rules
  (id TEXT PRIMARY KEY,
   entity_type TEXT NOT NULL,
   stage TEXT,
   conditions_op TEXT DEFAULT 'and',
   conditions TEXT,
   actions TEXT,
   tombstone INTEGER DEFAULT 0);
```

## Migration Notes

- Existing rules without `entityType` will default to empty string (backward compatibility)
- Applications should register their entity types before creating rules
- The system validates fields dynamically, so invalid fields will be rejected at rule creation time

## Benefits

1. **Generic**: Works with any entity type, not just transactions
2. **Type-safe**: Fields are validated against entity type definitions
3. **Extensible**: Easy to add new entity types and fields
4. **Clean**: Removed budget-specific filters that don't apply to generic entities
5. **Flexible**: Each entity type can define its own fields and operations
