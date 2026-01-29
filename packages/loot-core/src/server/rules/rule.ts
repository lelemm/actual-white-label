// @ts-strict-ignore
// White-label version: Simplified rule execution without transaction-specific logic
import { type RuleEntity } from '../../types/models';

import { Action } from './action';
import { Condition } from './condition';

// Simplified execActions for white-label version (no transaction splits)
export function execActions(actions: Action[], object: Record<string, unknown>) {
  const result = { ...object };
  actions.forEach(action => action.exec(result));
  return result;
}

export class Rule {
  actions: Action[];
  conditions: Condition[];
  conditionsOp;
  id?: string;
  stage: 'pre' | null | 'post';
  entityType?: string;

  constructor({
    id,
    stage,
    conditionsOp,
    conditions,
    actions,
    entityType,
  }: {
    id?: string;
    stage?: 'pre' | null | 'post';
    conditionsOp;
    conditions;
    actions;
    entityType?: string;
  }) {
    this.id = id;
    this.stage = stage ?? null;
    this.conditionsOp = conditionsOp;
    this.entityType = entityType;
    this.conditions = conditions.map(
      c => new Condition(c.op, c.field, c.value, c.options, entityType),
    );
    this.actions = actions.map(
      a => new Action(a.op, a.field, a.value, a.options, entityType),
    );
  }

  evalConditions(object): boolean {
    if (this.conditions.length === 0) {
      return false;
    }

    const method = this.conditionsOp === 'or' ? 'some' : 'every';
    return this.conditions[method](condition => {
      return condition.eval(object);
    });
  }

  execActions<T extends Record<string, unknown>>(object: T): Partial<T> {
    const result = execActions(this.actions, {
      ...object,
    });
    const changes: Partial<T> = {};
    for (const cur of Object.keys(result)) {
      if (result[cur] !== object[cur]) {
        changes[cur as keyof T] = result[cur] as T[keyof T];
      }
    }
    return changes;
  }

  exec(object) {
    if (this.evalConditions(object)) {
      return this.execActions(object);
    }
    return null;
  }

  // Apply is similar to exec but applies the changes for you
  apply(object) {
    const changes = this.exec(object);
    return Object.assign({}, object, changes);
  }

  getId(): string | undefined {
    return this.id;
  }

  serialize(): RuleEntity {
    return {
      id: this.id,
      entityType: this.entityType || '',
      stage: this.stage,
      conditionsOp: this.conditionsOp,
      conditions: this.conditions.map(c => c.serialize()),
      actions: this.actions.map(a => a.serialize()),
    };
  }
}
