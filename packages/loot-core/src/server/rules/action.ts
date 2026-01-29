// @ts-strict-ignore
// White-label version: Generic Action class for entity-type aware rules

import { logger } from '../../platform/server/log';
import { RuleError } from '../errors';
import { getFieldsForEntityType } from '../../shared/rules';
import { type RuleActionEntity } from '../../types/models';

export class Action {
  op: string;
  field: string | null;
  value: unknown;
  options: Record<string, unknown> | null;
  entityType?: string;

  constructor(
    op: string,
    field: string | null,
    value: unknown,
    options: Record<string, unknown> | null,
    entityType?: string,
  ) {
    if (!op) {
      throw new RuleError('invalid-action-operation', 'Invalid action operation');
    }

    this.op = op;
    this.field = field;
    this.value = value;
    this.options = options;
    this.entityType = entityType;

    // Validate field if provided and entityType is known
    if (field && entityType) {
      const fields = getFieldsForEntityType(entityType);
      if (!fields || !fields[field]) {
        throw new RuleError('invalid-field', `Invalid field: ${field} for entity type: ${entityType}`);
      }
    }

    // Validate value is not empty for required fields
    if (field && value === '') {
      throw new RuleError('empty-field', 'Field cannot be empty');
    }
  }

  exec(object: Record<string, unknown>): void {
    if (this.op === 'set' && this.field) {
      let value = this.value;

      // Handle templating if options.template is provided
      if (this.options?.template) {
        value = this._applyTemplate(this.options.template as string, object);
      }

      object[this.field] = value;
    } else if (this.op === 'delete-entity') {
      // Mark entity for deletion - actual deletion should be handled by the application
      object._markedForDeletion = true;
    } else {
      throw new RuleError('invalid-action-operation', `Unknown action: ${this.op}`);
    }
  }

  _applyTemplate(template: string, object: Record<string, unknown>): string {
    // Simple template replacement - replace {{field}} with object[field]
    return template.replace(/\{\{(\w+)\}\}/g, (match, field) => {
      return String(object[field] ?? '');
    });
  }

  serialize(): RuleActionEntity {
    if (this.op === 'delete-entity') {
      return {
        op: 'delete-entity',
        value: this.value as string | undefined,
      };
    }
    return {
      op: 'set',
      field: this.field || '',
      value: this.value,
      options: this.options || undefined,
    };
  }
}
