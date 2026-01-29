/**
 * Example: How to register entity types for rules
 * 
 * Applications should register their entity types when initializing the app.
 * This allows rules to work with any entity type dynamically.
 */

import {
  entityTypeRegistry,
  type EntityTypeDefinition,
} from './rules-entity';

/**
 * Example: Register a "transaction" entity type
 * 
 * This shows how to register an entity type with its available fields.
 * Applications can register multiple entity types.
 */
export function registerExampleEntityTypes() {
  // Example: Transaction entity type
  entityTypeRegistry.register({
    id: 'transaction',
    displayName: 'Transaction',
    defaultFields: {
      date: true,
      notes: true,
      amount: true,
    },
    fields: {
      // Additional custom fields can be added here
      status: {
        type: 'string',
        displayName: 'Status',
      },
      priority: {
        type: 'number',
        displayName: 'Priority',
      },
    },
  });

  // Example: Patient entity type (for clinic management)
  entityTypeRegistry.register({
    id: 'patient',
    displayName: 'Patient',
    defaultFields: {
      date: true, // registration date
      notes: true, // notes about patient
    },
    fields: {
      name: {
        type: 'string',
        required: true,
        displayName: 'Name',
      },
      email: {
        type: 'string',
        displayName: 'Email',
      },
      age: {
        type: 'number',
        displayName: 'Age',
      },
      active: {
        type: 'boolean',
        displayName: 'Active',
      },
    },
  });

  // Example: Appointment entity type
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
      confirmed: {
        type: 'boolean',
        displayName: 'Confirmed',
      },
    },
  });
}

/**
 * Usage in application initialization:
 * 
 * import { registerExampleEntityTypes } from 'loot-core/types/rules-entity-example';
 * 
 * // Register entity types before using rules
 * registerExampleEntityTypes();
 * 
 * // Now rules can be created for any registered entity type
 * const rule = {
 *   entityType: 'patient',
 *   conditions: [
 *     { field: 'age', op: 'gt', value: 18 },
 *     { field: 'active', op: 'is', value: true },
 *   ],
 *   actions: [
 *     { field: 'notes', op: 'set', value: 'Adult patient' },
 *   ],
 * };
 */
