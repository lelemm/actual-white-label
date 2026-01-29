// White-label version: Generic rule types with entity type support

export type NewRuleEntity = {
  /** Entity type this rule applies to (e.g., 'transaction', 'patient', 'appointment') */
  entityType: string;
  stage: 'pre' | null | 'post';
  conditionsOp: 'or' | 'and';
  conditions: RuleConditionEntity[];
  actions: RuleActionEntity[];
  tombstone?: boolean;
};

export type RuleEntity = {
  id: string;
} & NewRuleEntity;

// Define operations separately to avoid circular reference
export type RuleConditionOp =
  | 'is'
  | 'isNot'
  | 'oneOf'
  | 'notOneOf'
  | 'contains'
  | 'doesNotContain'
  | 'matches'
  | 'isapprox'
  | 'isbetween'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

// Generic field value types - dynamically determined by entity type
export type FieldValueTypes = {
  [field: string]: string | number | boolean | string[] | null | undefined;
};

type BaseConditionEntity<
  Field extends keyof FieldValueTypes,
  Op extends RuleConditionOp,
> = {
  field: Field;
  op: Op;
  value: Op extends 'oneOf' | 'notOneOf'
    ? Array<FieldValueTypes[Field]>
    : Op extends 'isbetween'
      ? { num1: number; num2: number }
      : FieldValueTypes[Field];
  options?: {
    inflow?: boolean;
    outflow?: boolean;
    month?: boolean;
    year?: boolean;
  };
  conditionsOp?: string;
  type?: 'id' | 'boolean' | 'date' | 'number' | 'string';
  customName?: string;
  queryFilter?: Record<string, { $oneof: string[] }>;
};

// Generic condition entity - field is dynamically determined by entity type
// Removed specific filters: hasTags, reconciled, cleared, transfer, parent, saved
export type RuleConditionEntity = {
  field: string; // Field name (dynamically determined by entity type)
  op: RuleConditionOp;
  value: unknown;
  options?: {
    inflow?: boolean;
    outflow?: boolean;
    month?: boolean;
    year?: boolean;
  };
  conditionsOp?: string;
  type?: 'id' | 'boolean' | 'date' | 'number' | 'string';
  customName?: string;
  queryFilter?: Record<string, { $oneof: string[] }>;
};

// Generic action entity - supports any field from the entity type
export type RuleActionEntity =
  | SetRuleActionEntity
  | DeleteEntityRuleActionEntity;

export type SetRuleActionEntity = {
  field: string; // Field name (dynamically determined by entity type)
  op: 'set';
  value: unknown;
  options?: {
    template?: string;
    formula?: string;
  };
  type?: string;
};

export type DeleteEntityRuleActionEntity = {
  op: 'delete-entity';
  value?: string; // Optional entity ID
};
