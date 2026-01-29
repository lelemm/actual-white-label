import React, { useMemo } from 'react';

import { View } from '@actual-app/components/view';

import {
  getValidOps,
  getValidOpsLegacy,
  getFieldsForEntityType,
  mapField,
  FIELD_TYPES,
} from 'loot-core/shared/rules';
import { type RuleConditionEntity } from 'loot-core/types/models';

import { FieldSelect, OpSelect } from '@desktop-client/components/rules/RuleEditor';

// Import GenericInput from RuleEditor - it's a local function, so we'll create a simple version
function GenericInput({
  value,
  onChange,
  type,
  field,
  op,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  type: string;
  field: string;
  op: string;
}) {
  const inputType =
    type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
  const multi = op === 'oneOf' || op === 'notOneOf';

  if (multi) {
    return (
      <input
        type="text"
        value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
        onChange={e => onChange(e.target.value.split(', '))}
      />
    );
  }
  return (
    <input
      type={inputType}
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
    />
  );
}

type FilterEditorProps = {
  field: RuleConditionEntity['field'];
  op: RuleConditionEntity['op'];
  value: RuleConditionEntity['value'];
  options: RuleConditionEntity['options'];
  onSave: (cond: RuleConditionEntity) => void;
  onClose: () => void;
};

export function FilterEditor({
  field,
  op,
  value,
  options,
  onSave,
  onClose,
}: FilterEditorProps) {
  // Use a default entity type - in white-label version, filters work on generic entities
  const entityType = 'transaction'; // Default entity type for filters
  const fieldType = FIELD_TYPES.get(field) || 'string';
  // Try to get valid ops for the entity type, fallback to legacy if field not found
  const entityFields = getFieldsForEntityType(entityType);
  const validOps = entityFields?.[field]
    ? getValidOps(entityType, field)
    : getValidOpsLegacy(field);

  const fields = useMemo(() => {
    // Get fields for filter conditions
    const availableFields = getFieldsForEntityType(entityType);
    if (!availableFields) return [];
    return Object.entries(availableFields).map(([name, def]) => [
      name,
      mapField(name),
    ]) as [string, string][];
  }, [entityType]);

  const handleChange = (name: string, newValue: unknown) => {
    const updated: RuleConditionEntity = {
      field: name === 'field' ? (newValue as string) : field,
      op: name === 'op' ? (newValue as RuleConditionEntity['op']) : op,
      value: name === 'value' ? newValue : value,
      options: options,
    };
    onSave(updated);
  };

  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FieldSelect
        fields={fields}
        value={field}
        onChange={value => handleChange('field', value)}
      />
      <OpSelect
        ops={validOps}
        type={fieldType}
        value={op}
        onChange={value => handleChange('op', value)}
      />
      <GenericInput
        field={field}
        type={fieldType}
        value={value ?? ''}
        op={op}
        onChange={v => handleChange('value', v)}
      />
    </View>
  );
}
