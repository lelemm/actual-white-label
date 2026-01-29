/**
 * Generic interface for entities that rules can operate on
 * White-label applications should implement this interface for their entities
 */
export interface RuleTarget {
  /** Unique identifier for the entity */
  id: string;
  
  /** Optional date field - if present, rules can filter by date */
  date?: string;
  
  /** Optional notes/description field - if present, rules can filter/modify text */
  notes?: string;
  
  /** Optional amount/numeric field - if present, rules can filter by numeric values */
  amount?: number;
  
  /** Any additional fields specific to the entity type */
  [key: string]: unknown;
}

/**
 * Field type definitions for rule conditions and actions
 */
export type RuleFieldType = 'date' | 'string' | 'number' | 'boolean' | 'id';

/**
 * Field definition for an entity type
 */
export interface EntityFieldDefinition {
  /** Type of the field */
  type: RuleFieldType;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Operations that are not allowed on this field */
  disallowedOps?: Set<string>;
  
  /** Display name for the field */
  displayName?: string;
}

/**
 * Entity type definition - describes what fields are available for an entity type
 */
export interface EntityTypeDefinition {
  /** Unique identifier for the entity type (e.g., 'transaction', 'patient', 'appointment') */
  id: string;
  
  /** Display name for the entity type */
  displayName: string;
  
  /** Field definitions for this entity type */
  fields: Record<string, EntityFieldDefinition>;
  
  /** Default fields that are always available */
  defaultFields?: {
    date?: boolean;
    notes?: boolean;
    amount?: boolean;
  };
}

/**
 * Registry for entity types
 * Applications should register their entity types here
 */
class EntityTypeRegistry {
  private types: Map<string, EntityTypeDefinition> = new Map();

  /**
   * Register an entity type
   */
  register(type: EntityTypeDefinition): void {
    this.types.set(type.id, type);
  }

  /**
   * Get an entity type definition
   */
  get(typeId: string): EntityTypeDefinition | undefined {
    return this.types.get(typeId);
  }

  /**
   * Get all registered entity types
   */
  getAll(): EntityTypeDefinition[] {
    return Array.from(this.types.values());
  }

  /**
   * Get fields for an entity type
   */
  getFields(typeId: string): Record<string, EntityFieldDefinition> | undefined {
    const type = this.get(typeId);
    if (!type) return undefined;

    const fields: Record<string, EntityFieldDefinition> = { ...type.fields };

    // Add default fields if specified
    if (type.defaultFields) {
      if (type.defaultFields.date) {
        fields.date = {
          type: 'date',
          displayName: 'Date',
        };
      }
      if (type.defaultFields.notes) {
        fields.notes = {
          type: 'string',
          displayName: 'Notes',
          disallowedOps: new Set(['oneOf', 'notOneOf']),
        };
      }
      if (type.defaultFields.amount) {
        fields.amount = {
          type: 'number',
          displayName: 'Amount',
        };
      }
    }

    return fields;
  }
}

export const entityTypeRegistry = new EntityTypeRegistry();
