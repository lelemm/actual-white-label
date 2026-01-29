// @ts-strict-ignore
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  SvgAdd,
  SvgDelete,
  SvgSubtract,
} from '@actual-app/components/icons/v0';
import {
  SvgCode,
  SvgInformationOutline,
} from '@actual-app/components/icons/v1';
import { Menu } from '@actual-app/components/menu';
import { Select } from '@actual-app/components/select';
import { SpaceBetween } from '@actual-app/components/space-between';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { Tooltip } from '@actual-app/components/tooltip';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';
import { v4 as uuid } from 'uuid';

import { send } from 'loot-core/platform/client/fetch';
import * as monthUtils from 'loot-core/shared/months';
import { q } from 'loot-core/shared/query';
import {
  FIELD_TYPES,
  friendlyOp,
  getAllocationMethods,
  getFieldError,
  getValidOps,
  isValidOp,
  isValidOpLegacy,
  getValidOpsLegacy,
  makeValue,
  mapField,
  parse,
  unparse,
  getFieldsForEntityType,
} from 'loot-core/shared/rules';
import {
  type NewRuleEntity,
  type RuleActionEntity,
  type RuleEntity,
} from 'loot-core/types/models';

import { FormulaActionEditor } from './FormulaActionEditor';

import { FinancialText } from '@desktop-client/components/FinancialText';
import { BetweenAmountInput } from '@desktop-client/components/util/AmountInput';
import { useDateFormat } from '@desktop-client/hooks/useDateFormat';
import { useFormat } from '@desktop-client/hooks/useFormat';
import {
  SelectedProvider,
  useSelected,
} from '@desktop-client/hooks/useSelected';
import { addNotification } from '@desktop-client/notifications/notificationsSlice';
import { aqlQuery } from '@desktop-client/queries/aqlQuery';

// White-label version: Stub components for removed functionality
function GenericInput({ value, onChange, type, field, op, numberFormatType, inputStyle, multi }: any) {
  const inputType = type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
  if (multi) {
    return <input type="text" value={Array.isArray(value) ? value.join(', ') : ''} onChange={e => onChange(e.target.value.split(', '))} />;
  }
  return <input type={inputType} value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={inputStyle} />;
}

function DisplayId({ id }: { id: string }) {
  return <span>{id}</span>;
}
import { useDispatch } from '@desktop-client/redux';
import { disableUndo, enableUndo } from '@desktop-client/undo';

function updateValue(array, value, update) {
  return array.map(v => (v === value ? update() : v));
}

function applyErrors(array, errorsArray) {
  return array.map((item, i) => {
    return { ...item, error: errorsArray[i] };
  });
}

function getTransactionFields(conditions, actions) {
  const fields = ['date'];

  if (conditions.find(c => c.field === 'imported_payee')) {
    fields.push('imported_payee');
  }

  fields.push('payee');

  if (actions.find(a => a.field === 'category')) {
    fields.push('category');
  } else if (
    actions.length > 0 &&
    !['payee', 'date', 'amount'].includes(actions[0].field)
  ) {
    fields.push(actions[0].field);
  }

  fields.push('amount');

  return fields;
}

type FieldSelectProps<T extends string> = {
  fields: [T, string][];
  style?: CSSProperties;
  value: T;
  onChange: (value: T) => void;
};

export function FieldSelect<T extends string>({
  fields,
  style,
  value,
  onChange,
}: FieldSelectProps<T>) {
  return (
    <View style={style} data-testid="field-select">
      <Select
        bare
        options={fields}
        value={value}
        onChange={onChange}
        className={css({
          color: theme.pageTextPositive,
          '&[data-hovered]': { color: theme.pageTextPositive },
        })}
      />
    </View>
  );
}

type OpSelectProps<T extends string> = {
  ops: T[];
  type?: string;
  style?: CSSProperties;
  value: T;
  formatOp?: (op: string, type: string) => string;
  onChange: (name: string, value: T) => void;
};

export function OpSelect<T extends string>({
  ops,
  type,
  style,
  value,
  formatOp = friendlyOp,
  onChange,
}: OpSelectProps<T>) {
  const opOptions = useMemo(() => {
    const options = ops
      // We don't support the `contains`, `doesNotContain`, `matches` operators
      // for the id type rules yet
      // TODO: Add matches op support for payees, accounts, categories.
      .filter(op =>
        type === 'id'
          ? !['contains', 'matches', 'doesNotContain', 'hasTags'].includes(op)
          : true,
      )
      .map(op => [op, formatOp(op, type)]);

    if (type === 'string' || type === 'id') {
      // @ts-expect-error fix this
      options.splice(Math.ceil(options.length / 2), 0, Menu.line);
    }

    return options;
  }, [formatOp, ops, type]);

  return (
    <View data-testid="op-select">
      <Select
        bare
        // @ts-expect-error fix this
        options={opOptions}
        value={value}
        onChange={value => onChange('op', value)}
        style={style}
      />
    </View>
  );
}

type SplitAmountMethodSelectProps = {
  options: [string, string][];
  style?: CSSProperties;
  value: string;
  onChange: (name: string, value: string) => void;
};
function SplitAmountMethodSelect({
  options,
  style,
  value,
  onChange,
}: SplitAmountMethodSelectProps) {
  return (
    <View
      style={{ color: theme.pageTextPositive, ...style }}
      data-testid="field-select"
    >
      <Select
        bare
        options={options}
        value={value}
        onChange={value => onChange('method', value)}
      />
    </View>
  );
}

function EditorButtons({ onAdd, onDelete }) {
  const { t } = useTranslation();
  return (
    <>
      {onDelete && (
        <Button
          variant="bare"
          onPress={onDelete}
          style={{ padding: 7 }}
          aria-label={t('Delete entry')}
        >
          <SvgSubtract style={{ width: 8, height: 8, color: 'inherit' }} />
        </Button>
      )}
      {onAdd && (
        <Button
          variant="bare"
          onPress={onAdd}
          style={{ padding: 7 }}
          aria-label={t('Add entry')}
        >
          <SvgAdd style={{ width: 10, height: 10, color: 'inherit' }} />
        </Button>
      )}
    </>
  );
}

function FieldError({ type }) {
  return (
    <Text
      style={{
        fontSize: 12,
        textAlign: 'center',
        color: theme.errorText,
        marginBottom: 5,
      }}
    >
      {getFieldError(type)}
    </Text>
  );
}

function Editor({ error, style, children }) {
  return (
    <View style={style} data-testid="editor-row">
      <SpaceBetween gap={5} style={{ alignItems: 'center' }}>
        {children}
      </SpaceBetween>
      {error && <FieldError type={error} />}
    </View>
  );
}

function ConditionEditor({
  ops,
  condition,
  editorStyle,
  onChange,
  onDelete,
  onAdd,
  entityFields,
}) {
  const {
    field: originalField,
    op,
    value,
    type,
    options,
    error,
    inputKey,
  } = condition;

  const translatedConditions = useMemo(() => {
    // Use dynamic fields from entity type only; show empty until entity type is selected
    const fields = entityFields?.fields?.length
      ? entityFields.fields.map(f => [f.name, f.displayName])
      : [];

    const retValue = [...fields];

    if (retValue && retValue.length > 0) {
      retValue.forEach(field => {
        field[1] = mapField(field[0]);
      });
    }

    return retValue;
  }, [entityFields]);

  let field = originalField;
  if (field === 'amount' && options) {
    if (options.inflow) {
      field = 'amount-inflow';
    } else if (options.outflow) {
      field = 'amount-outflow';
    }
  }

  let valueEditor;
  if (type === 'number' && op === 'isbetween') {
    valueEditor = (
      <BetweenAmountInput
        key={inputKey}
        defaultValue={value}
        onChange={v => onChange('value', v)}
      />
    );
  } else {
    valueEditor = (
      <GenericInput
        key={inputKey}
        field={field}
        type={type}
        value={value ?? ''}
        op={op}
        multi={op === 'oneOf' || op === 'notOneOf'}
        onChange={v => onChange('value', v)}
        numberFormatType="currency"
      />
    );
  }

  return (
    <Editor style={editorStyle} error={error}>
      <FieldSelect
        fields={translatedConditions}
        value={field}
        onChange={value => onChange('field', value)}
      />
      <OpSelect ops={ops} value={op} type={type} onChange={onChange} />

      <View style={{ flex: 1, minWidth: 80 }}>{valueEditor}</View>

      <SpaceBetween direction="horizontal" gap={0}>
          <EditorButtons
            onAdd={onAdd}
            onDelete={onDelete}
          />
      </SpaceBetween>
    </Editor>
  );
}

function formatAmount(amount, format) {
  if (!amount) {
    return format(0, 'financial');
  } else if (typeof amount === 'number') {
    return format(amount, 'financial');
  } else {
    return `${format(amount.num1, 'financial')} to ${format(
      amount.num2,
      'financial',
    )}`;
  }
}

// ScheduleDescription removed for white-label version

function getActionFields() {
  return [
    'category',
    'payee',
    'payee_name',
    'notes',
    'cleared',
    'account',
    'date',
    'amount',
  ].map(field => [field, mapField(field)]);
}
const parentOnlyFields = ['amount', 'cleared', 'account', 'date'];
function getSplitActionFields() {
  return getActionFields().filter(
    ([field]) => !parentOnlyFields.includes(field),
  );
}
function getAllocationMethodOptions() {
  return Object.entries(getAllocationMethods());
}

type ActionEditorProps = {
  action: RuleActionEntity & {
    field: string;
    type: string;
    error: unknown;
    inputKey?: string;
  };
  editorStyle: CSSProperties;
  onChange: (
    name: string,
    value: unknown,
    extraOptions?: Record<string, unknown>,
  ) => void;
  onDelete: () => void;
  onAdd: () => void;
  entityFields?: {
    fields: Array<{ name: string; type: string; displayName: string }>;
    validOps: Record<string, string[]>;
  };
};
function ActionEditor({
  action,
  editorStyle,
  onChange,
  onDelete,
  onAdd,
  entityFields,
}: ActionEditorProps) {
  const { t } = useTranslation();
  const {
    field,
    op,
    value,
    type,
    error,
    inputKey = 'initial',
    // @ts-expect-error fix this
    options,
  } = action;

  const templated = options?.template !== undefined;
  const hasFormula = options?.formula !== undefined;

  // Use dynamic fields from entity type if available, otherwise fallback to legacy fields
  const availableFields = entityFields?.fields?.length
    ? entityFields.fields.map(f => [f.name, f.displayName])
    : options?.splitIndex
      ? getSplitActionFields()
      : getActionFields();

  const fields = availableFields.filter(
    ([s]) => !s.includes('_name') || field === s,
  );

  return (
    <Editor style={editorStyle} error={error}>
      {op === 'set' || op === 'delete-entity' ? (
        <>
          <OpSelect
            ops={['set', 'delete-entity']}
            value={op}
            onChange={onChange}
          />

          <FieldSelect
            // @ts-expect-error fix this
            fields={fields}
            value={field}
            onChange={value => onChange('field', value)}
          />

          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {hasFormula ? (
                <FormulaActionEditor
                  value={options?.formula || ''}
                  onChange={v => onChange('formula', v, { formula: true })}
                />
              ) : (
                <GenericInput
                  key={inputKey}
                  field={field}
                  type={templated ? 'string' : type}
                  op={op}
                  value={options?.template ?? value}
                  onChange={v => onChange('value', v)}
                  numberFormatType="currency"
                  inputStyle={{ height: 30 }}
                />
              )}
            </View>
          </View>
          {/*Due to that these fields have id's as value it is not helpful to have templating here*/}
          {hasFormula &&
            ['payee', 'category', 'account'].indexOf(field) === -1 && (
              <Button
                variant="bare"
                isDisabled={templated}
                style={{
                  padding: 5,
                  backgroundColor: hasFormula
                    ? theme.buttonPrimaryBackground
                    : undefined,
                  height: 24,
                  width: 24,
                }}
                aria-label={
                  hasFormula ? t('Disable formula') : t('Enable formula')
                }
                onPress={() =>
                  hasFormula
                    ? onChange('formula', undefined)
                    : onChange('formula', options.formula || value || '=')
                }
              >
                {hasFormula ? (
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: 'serif',
                      textAlign: 'center',
                    }}
                  >
                    ƒ
                  </span>
                ) : hasFormula ? (
                  <SvgCode
                    style={{ width: 12, height: 12, color: 'inherit' }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: 'serif',
                      textAlign: 'center',
                    }}
                  >
                    ƒ
                  </span>
                )}
              </Button>
            )}
          {templated &&
            ['payee', 'category', 'account'].indexOf(field) === -1 && (
              <Button
                variant="bare"
                isDisabled={hasFormula}
                style={{
                  padding: 5,
                  backgroundColor: templated
                    ? theme.buttonPrimaryBackground
                    : undefined,
                }}
                aria-label={
                  templated ? t('Disable templating') : t('Enable templating')
                }
                onPress={() => onChange('template', !templated)}
              >
                <SvgCode style={{ width: 12, height: 12, color: 'inherit' }} />
              </Button>
            )}
        </>
      ) : op === 'delete-entity' ? (
        <OpSelect
          ops={['set', 'delete-entity']}
          value={op}
          onChange={onChange}
        />
      ) : null}

      <SpaceBetween gap={0} style={{ flexShrink: 0 }}>
        <EditorButtons
          onAdd={onAdd}
          onDelete={op === 'set' && onDelete}
        />
      </SpaceBetween>
    </Editor>
  );
}

function StageInfo() {
  return (
    <View style={{ position: 'relative', marginLeft: 5 }}>
      <Tooltip
        content={
          <Trans>
            The stage of a rule allows you to force a specific order. Pre rules
            always run first, and post rules always run last. Within each stage
            rules are automatically ordered from least to most specific.
          </Trans>
        }
        placement="bottom start"
        style={{
          ...styles.tooltip,
          padding: 10,
          color: theme.pageTextLight,
          maxWidth: 450,
          lineHeight: 1.5,
        }}
      >
        <SvgInformationOutline
          style={{ width: 11, height: 11, color: theme.pageTextLight }}
        />
      </Tooltip>
    </View>
  );
}

type StageButtonProps = {
  selected: boolean;
  children: ReactNode;
  style?: CSSProperties;
  onSelect: () => void;
};
function StageButton({
  selected,
  children,
  style,
  onSelect,
}: StageButtonProps) {
  return (
    <Button
      variant="bare"
      style={{
        fontSize: 'inherit',
        ...(selected && {
          backgroundColor: theme.pillBackgroundSelected,
          ':hover': { backgroundColor: theme.pillBackgroundSelected },
        }),
        ...style,
      }}
      onPress={onSelect}
    >
      {children}
    </Button>
  );
}

function newInput(item) {
  return { ...item, inputKey: uuid() };
}

function ConditionsList({
  conditionsOp,
  conditions,
  editorStyle,
  onChangeConditions,
  entityFields,
  entityType,
}) {
  function addCondition(index) {
    // Use dynamic fields from entity type if available
    const availableFields = entityFields?.fields?.length
      ? entityFields.fields.map(f => f.name)
      : conditionFields.map(f => f[0]);

    // (remove the inflow and outflow pseudo-fields since they'd be a pain to get right)
    let fields = availableFields.filter(
      f => f !== 'amount-inflow' && f !== 'amount-outflow',
    );

    // suggest a sensible next field: the same if 'or' or different if 'and'
    if (conditions.length && conditionsOp === 'or') {
      fields = [conditions[0].field];
    } else {
      fields = fields.filter(
        f => !conditions.some(c => c.field.includes(f) || f.includes(c.field)),
      );
    }
    const field = fields[0] || availableFields[0] || 'date';

    // Get field type from entity fields or fallback to FIELD_TYPES
    const fieldType =
      entityFields?.fields?.find(f => f.name === field)?.type ||
      FIELD_TYPES.get(field);

    const copy = [...conditions];
    copy.splice(index + 1, 0, {
      type: fieldType,
      field,
      op: 'is',
      value: null,
      inputKey: uuid(),
    });
    onChangeConditions(copy);
  }

  function addInitialCondition() {
    addCondition(-1);
  }

  function removeCondition(cond) {
    onChangeConditions(conditions.filter(c => c !== cond));
  }

  function updateCondition(cond, field, value) {
    onChangeConditions(
      updateValue(conditions, cond, () => {
        if (field === 'field') {
          const newCond = { field: value };

          if (value === 'amount-inflow') {
            newCond.field = 'amount';
            // @ts-expect-error fix this
            newCond.options = { inflow: true };
          } else if (value === 'amount-outflow') {
            newCond.field = 'amount';
            // @ts-expect-error fix this
            newCond.options = { outflow: true };
          }

          // Get field type from entity fields or fallback to FIELD_TYPES
          const newFieldType =
            entityFields?.fields?.find(f => f.name === newCond.field)?.type ||
            FIELD_TYPES.get(newCond.field);
          // @ts-expect-error fix this
          newCond.type = newFieldType;

          const prevFieldType =
            entityFields?.fields?.find(f => f.name === cond.field)?.type ||
            FIELD_TYPES.get(cond.field);
          if (
            (prevFieldType === 'string' || prevFieldType === 'number') &&
            // @ts-expect-error fix this
            prevFieldType === newCond.type &&
            cond.op !== 'isbetween' &&
            (entityType
              ? isValidOp(entityType, newCond.field, cond.op)
              : isValidOpLegacy(newCond.field, cond.op))
          ) {
            // Don't clear the value & op if the type is string/number and
            // the type hasn't changed
            // @ts-expect-error fix this
            newCond.op = cond.op;
            return newInput(makeValue(cond.value, newCond));
          } else {
            // @ts-expect-error fix this
            newCond.op = entityType
              ? getValidOps(entityType, newCond.field)[0]
              : getValidOpsLegacy(newCond.field)[0];
            return newInput(makeValue(null, newCond));
          }
        } else if (field === 'op') {
          const op = value;

          // Switching between oneOf and other operators is a
          // special-case. It changes the input type, so we need to
          // clear the value
          if (
            cond.op !== 'oneOf' &&
            cond.op !== 'notOneOf' &&
            (op === 'oneOf' || op === 'notOneOf')
          ) {
            return newInput(
              makeValue(cond.value != null ? [cond.value] : [], {
                ...cond,
                op: value,
              }),
            );
          } else if (
            (cond.op === 'oneOf' || cond.op === 'notOneOf') &&
            op !== 'oneOf' &&
            op !== 'notOneOf'
          ) {
            return newInput(
              makeValue(cond.value.length > 0 ? cond.value[0] : null, {
                ...cond,
                op: value,
              }),
            );
          } else if (cond.op !== 'isbetween' && op === 'isbetween') {
            // TODO: I don't think we need `makeValue` anymore. It
            // tries to parse the value as a float and we had to
            // special-case isbetween. I don't know why we need that
            // behavior and we can probably get rid of `makeValue`
            return makeValue(
              {
                num1: cond.value,
                num2: cond.value,
              },
              { ...cond, op: value },
            );
          } else if (cond.op === 'isbetween' && op !== 'isbetween') {
            return makeValue(cond.value.num1 || 0, {
              ...cond,
              op: value,
            });
          } else {
            return { ...cond, op: value };
          }
        } else if (field === 'value') {
          return makeValue(value, cond);
        }

        return cond;
      }),
    );
  }

  return conditions.length === 0 ? (
    <Button style={{ alignSelf: 'flex-start' }} onPress={addInitialCondition}>
      <Trans>Add condition</Trans>
    </Button>
  ) : (
    <SpaceBetween direction="vertical" gap={10} data-testid="condition-list">
      {conditions.map((cond, i) => {
        let ops = entityType
          ? getValidOps(entityType, cond.field)
          : getValidOpsLegacy(cond.field);

        // Hack for now, these ops should be the only ones available
        // for recurring dates
        if (cond.type === 'date' && cond.value && cond.value.frequency) {
          ops = ['is', 'isapprox'];
        } else if (
          cond.options &&
          (cond.options.inflow || cond.options.outflow)
        ) {
          ops = ops.filter(op => op !== 'isbetween');
        }

        return (
          <View key={i} style={{ width: '100%' }}>
            <ConditionEditor
              editorStyle={editorStyle}
              ops={ops}
              condition={cond}
              onChange={(name, value) => {
                updateCondition(cond, name, value);
              }}
              onDelete={() => removeCondition(cond)}
              onAdd={() => addCondition(i)}
              entityFields={entityFields}
            />
          </View>
        );
      })}
    </SpaceBetween>
  );
}

const getActions = splits => splits.flatMap(s => s.actions);
const getUnparsedActions = splits => getActions(splits).map(unparse);

// TODO:
// * Dont touch child transactions?

const conditionFields = [
  'imported_payee',
  'account',
  'category',
  'date',
  'payee',
  'notes',
  'amount',
]
  .map(field => [field, mapField(field)])
  .concat([
    ['amount-inflow', mapField('amount', { inflow: true })],
    ['amount-outflow', mapField('amount', { outflow: true })],
  ]);

type RuleEditorProps = {
  rule: RuleEntity | NewRuleEntity;
  onSave?: (rule: RuleEntity) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  style?: CSSProperties;
};

export function RuleEditor({
  rule: defaultRule,
  onSave: originalOnSave = undefined,
  onDelete,
  onCancel,
  style,
}: RuleEditorProps) {
  const { t } = useTranslation();
  const [conditions, setConditions] = useState(
    defaultRule.conditions.map(parse).map(c => ({ ...c, inputKey: uuid() })),
  );
  const [actionSplits, setActionSplits] = useState(() => {
    const parsedActions = defaultRule.actions.map(parse);
    return parsedActions.reduce(
      (acc, action) => {
        const splitIndex = action.options?.splitIndex ?? 0;
        acc[splitIndex] = acc[splitIndex] ?? { id: uuid(), actions: [] };
        acc[splitIndex].actions.push({ ...action, inputKey: uuid() });
        return acc;
      },
      // The pre-split group is always there
      [{ id: uuid(), actions: [] }],
    );
  });
  const [stage, setStage] = useState(defaultRule.stage);
  const [conditionsOp, setConditionsOp] = useState(defaultRule.conditionsOp);
  const [entityType, setEntityType] = useState(
    defaultRule.entityType || '',
  );
  const [entityTypes, setEntityTypes] = useState<
    Array<{ id: string; displayName: string }>
  >([]);
  const [entityFields, setEntityFields] = useState<{
    fields: Array<{ name: string; type: string; displayName: string }>;
    validOps: Record<string, string[]>;
  }>({ fields: [], validOps: {} });
  const [transactions, setTransactions] = useState([]);
  const dispatch = useDispatch();
  const scrollableEl = useRef(undefined);

  // Schedules removed for white-label version
  const isSchedule = false;

  useEffect(() => {
    // Load available entity types
    send('rules-get-entity-types').then(types => {
      setEntityTypes(types);
    });

    // Disable undo while this modal is open
    disableUndo();
    return () => enableUndo();
  }, [dispatch]);

  // Load fields when entity type changes
  useEffect(() => {
    if (entityType) {
      send('rules-get-entity-fields', { entityType }).then(fields => {
        setEntityFields(fields);
      });
    } else {
      setEntityFields({ fields: [], validOps: {} });
    }
  }, [entityType]);

  useEffect(() => {
    // Flash the scrollbar
    if (scrollableEl.current) {
      const el = scrollableEl.current;
      const top = el.scrollTop;
      el.scrollTop = top + 1;
      el.scrollTop = top;
    }

    // Run it here
    async function run() {
      const { filters } = await send('make-filters-from-conditions', {
        conditions: conditions.map(unparse),
      });

      if (filters.length > 0) {
        const conditionsOpKey = conditionsOp === 'or' ? '$or' : '$and';
        const parentOnlyCondition =
          actionSplits.length > 1 ? { is_child: false } : {};
        const { data: transactions } = await aqlQuery(
          q('transactions')
            .filter({ [conditionsOpKey]: filters, ...parentOnlyCondition })
            .select('*'),
        );
        setTransactions(transactions);
      } else {
        setTransactions([]);
      }
    }
    run();
  }, [actionSplits, conditions, conditionsOp]);

  const selectedInst = useSelected('transactions', transactions, []);

  function addInitialAction() {
    if (!entityType) {
      // Require entity type to be selected first
      return;
    }
    addActionToSplitAfterIndex(0, -1);
  }

  function addActionToSplitAfterIndex(splitIndex, actionIndex) {
    let newAction;
    // Split actions removed for white-label version - only support single actions
    if (splitIndex && !actionSplits[splitIndex]?.actions?.length) {
      // For white-label, just create a regular set action
      const availableFields = entityFields?.fields?.length
        ? entityFields.fields.map(f => f.name)
        : getActionFields().map(f => f[0]);
      const field = availableFields[0] || 'notes';
      const fieldType =
        entityFields?.fields?.find(f => f.name === field)?.type ||
        FIELD_TYPES.get(field);
      actionSplits[splitIndex] = { id: uuid(), actions: [] };
      newAction = {
        type: fieldType,
        field,
        op: 'set',
        value: '',
        options: { splitIndex },
        inputKey: uuid(),
      };
    } else {
      // Use dynamic fields from entity type if available
      const availableFields = entityFields?.fields?.length
        ? entityFields.fields.map(f => f.name)
        : splitIndex === 0
          ? getActionFields().map(f => f[0])
          : getSplitActionFields().map(f => f[0]);
      let fields = availableFields;
      for (const action of actionSplits[splitIndex].actions) {
        fields = fields.filter(f => f !== action.field);
      }
      const field = fields[0] || availableFields[0] || 'notes';
      const fieldType =
        entityFields?.fields?.find(f => f.name === field)?.type ||
        FIELD_TYPES.get(field);
      newAction = {
        type: fieldType,
        field,
        op: 'set',
        value: '',
        options: { splitIndex },
        inputKey: uuid(),
      };
    }

    const actionsCopy = [...actionSplits[splitIndex].actions];
    actionsCopy.splice(actionIndex + 1, 0, newAction);
    const copy = [...actionSplits];
    copy[splitIndex] = { ...actionSplits[splitIndex], actions: actionsCopy };
    setActionSplits(copy);
  }

  function onChangeAction(action, field, value, extraOptions?) {
    setActionSplits(
      actionSplits.map(({ id, actions }) => ({
        id,
        actions: updateValue(actions, action, () => {
          const a = { ...action };

          if (field === 'method') {
            a.options = { ...a.options, method: value };
          } else if (field === 'template') {
            if (value) {
              a.options = { ...a.options, template: a.value };
            } else {
              a.options = { ...a.options, template: undefined };
              if (a.type !== 'string') a.value = null;
            }
          } else if (field === 'formula') {
            if (value === undefined) {
              // Disable formula mode
              a.options = { ...a.options, formula: undefined };
              if (a.type !== 'string') a.value = null;
            } else {
              // Keep formula mode; allow empty string while editing
              a.options = { ...a.options, formula: String(value) };
            }
          } else {
            // Handle formula updates
            if (extraOptions?.formula && a.options?.formula !== undefined) {
              // Only update formula, not the value field
              a.options = {
                ...a.options,
                formula: value,
              };
            } else if (a.options?.template !== undefined) {
              // Only update template, not the value field
              a.options = {
                ...a.options,
                template: value,
              };
            } else {
              // Normal value update
              a[field] = value;
            }

            if (field === 'field') {
              a.type = FIELD_TYPES.get(a.field);
              a.value = value === 'date' ? '' : null;
              a.options = {
                ...a.options,
                template: undefined,
                formula: undefined,
              };
              return newInput(a);
            } else if (field === 'op') {
              a.value = null;
              a.inputKey = '' + Math.random();
              a.options = { ...a.options, template: undefined };
              return newInput(a);
            }
          }

          return a;
        }),
      })),
    );
  }

  function onChangeStage(stage) {
    setStage(stage);
  }

  function onChangeConditionsOp(value) {
    setConditionsOp(value);
  }

  function onRemoveAction(action) {
    setActionSplits(splits =>
      splits.map(({ id, actions }) => ({
        id,
        actions: actions.filter(a => a !== action),
      })),
    );
  }

  function onRemoveSplit(splitIndexToRemove) {
    setActionSplits(splits => {
      const copy = [];
      splits.forEach(({ id }, index) => {
        if (index === splitIndexToRemove) {
          return;
        }
        copy.push({ id, actions: [] });
      });
      getActions(splits).forEach(action => {
        const currentSplitIndex = action.options?.splitIndex ?? 0;
        if (currentSplitIndex === splitIndexToRemove) {
          return;
        }
        const newSplitIndex =
          currentSplitIndex > splitIndexToRemove
            ? currentSplitIndex - 1
            : currentSplitIndex;
        copy[newSplitIndex].actions.push({
          ...action,
          options: { ...action.options, splitIndex: newSplitIndex },
        });
      });
      return copy;
    });
  }

  function onApply() {
    const selectedTransactions = transactions.filter(({ id }) =>
      selectedInst.items.has(id),
    );
    send('rule-apply-actions', {
      transactions: selectedTransactions,
      actions: getUnparsedActions(actionSplits),
    }).then(() => {
      // Actions applied successfully
      setActionSplits([...actionSplits]);
    }).catch((error: Error) => {
      dispatch(
        addNotification({
          notification: {
            type: 'error',
            message: error.message || 'Failed to apply actions',
          },
        }),
      );
    });
  }

  async function onSave() {
    const rule = {
      ...defaultRule,
      entityType: entityType || '',
      stage,
      conditionsOp,
      conditions: conditions.map(unparse),
      actions: getUnparsedActions(actionSplits),
    };

    // @ts-expect-error fix this
    const method = rule.id ? 'rule-update' : 'rule-add';
    // @ts-expect-error fix this
    const { error, id: newId } = await send(method, rule);

    if (error) {
      // @ts-expect-error fix this
      if (error.conditionErrors) {
        // @ts-expect-error fix this
        setConditions(applyErrors(conditions, error.conditionErrors));
      }

      // @ts-expect-error fix this
      if (error.actionErrors) {
        let usedErrorIdx = 0;
        setActionSplits(
          actionSplits.map(item => ({
            ...item,
            actions: item.actions.map(action => ({
              ...action,
              // @ts-expect-error fix this
              error: error.actionErrors[usedErrorIdx++] ?? null,
            })),
          })),
        );
      }
    } else {
      // If adding a rule, we got back an id
      if (newId) {
        // @ts-expect-error fix this
        rule.id = newId;
      }

      // @ts-expect-error fix this
      originalOnSave?.(rule);
    }
  }

  // Enable editing existing split rules even if the feature has since been disabled.
  const showSplitButton = actionSplits.length > 0;

  return (
    <View style={style}>
      {/* Entity Type Selector */}
      {entityTypes.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 15,
            padding: '0 20px',
          }}
        >
          <Text style={{ marginRight: 15 }}>
            <Trans>Entity Type:</Trans>
          </Text>
          <FieldSelect
            style={{ minWidth: 200 }}
            fields={entityTypes.map(et => [et.id, et.displayName])}
            value={entityType}
            onChange={value => {
              setEntityType(value);
              // Clear conditions and actions when entity type changes
              setConditions([]);
              setActionSplits([{ id: uuid(), actions: [] }]);
            }}
          />
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 15,
          padding: '0 20px',
        }}
      >
        <Text style={{ marginRight: 15 }}>
          <Trans>Stage of rule:</Trans>
        </Text>

        <SpaceBetween gap={5} style={{ alignItems: 'center' }}>
          <StageButton
            selected={stage === 'pre'}
            onSelect={() => onChangeStage('pre')}
          >
            <Trans>Pre</Trans>
          </StageButton>
          <StageButton
            selected={stage === null}
            onSelect={() => onChangeStage(null)}
          >
            <Trans>Default</Trans>
          </StageButton>
          <StageButton
            selected={stage === 'post'}
            onSelect={() => onChangeStage('post')}
          >
            <Trans>Post</Trans>
          </StageButton>

          <StageInfo />
        </SpaceBetween>
      </View>

      <View
        innerRef={scrollableEl}
        style={{
          borderBottom: '1px solid ' + theme.tableBorder,
          padding: '0 20px 20px 20px',
          overflow: 'auto',
          maxHeight: 'calc(100% - 300px)',
          minHeight: 100,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <View style={{ flexShrink: 0 }}>
          <View style={{ marginBottom: 30 }}>
            <Text style={{ marginBottom: 15 }}>
              <Trans>
                If{' '}
                <FieldSelect
                  data-testid="conditions-op"
                  style={{ display: 'inline-flex' }}
                  fields={[
                    ['and', t('all')],
                    ['or', t('any')],
                  ]}
                  value={conditionsOp}
                  onChange={onChangeConditionsOp}
                />
                {{ allOrAny: '' }} of these conditions match:
              </Trans>
            </Text>

            <ConditionsList
              conditionsOp={conditionsOp}
              conditions={conditions}
              editorStyle={styles.editorPill}
              onChangeConditions={conds => setConditions(conds)}
              entityFields={entityFields}
              entityType={entityType}
            />
          </View>

          <Text style={{ marginBottom: 15 }}>
            <Trans>Then apply these actions:</Trans>
          </Text>
          <View style={{ flex: 1 }}>
            {actionSplits.length === 0 && (
              <Button
                style={{ alignSelf: 'flex-start' }}
                onPress={addInitialAction}
              >
                <Trans>Add action</Trans>
              </Button>
            )}
            <SpaceBetween
              direction="vertical"
              gap={10}
              data-testid="action-split-list"
            >
              {actionSplits.map(({ id, actions }, splitIndex) => (
                <View
                  key={id}
                  style={{ width: '100%' }}
                  nativeStyle={
                    actionSplits.length > 1
                      ? {
                          borderColor: theme.tableBorder,
                          borderWidth: '1px',
                          borderRadius: '5px',
                          padding: '5px',
                        }
                      : {}
                  }
                >
                  {actionSplits.length > 1 && (
                    <SpaceBetween
                      gap={5}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <Text
                        style={{
                          ...styles.smallText,
                          marginBottom: '10px',
                        }}
                      >
                        {splitIndex === 0
                          ? t('Apply to all')
                          : `${t('Split')} ${splitIndex}`}
                      </Text>
                      {splitIndex && (
                        <Button
                          variant="bare"
                          onPress={() => onRemoveSplit(splitIndex)}
                          style={{
                            width: 20,
                            height: 20,
                          }}
                          aria-label={t('Delete split')}
                        >
                          <SvgDelete
                            style={{
                              width: 8,
                              height: 8,
                              color: 'inherit',
                            }}
                          />
                        </Button>
                      )}
                    </SpaceBetween>
                  )}
                  <SpaceBetween
                    direction="vertical"
                    gap={10}
                    data-testid="action-list"
                  >
                    {actions.map((action, actionIndex) => (
                      <View key={actionIndex} style={{ width: '100%' }}>
                        <ActionEditor
                          action={action}
                          editorStyle={styles.editorPill}
                          onChange={(name, value, extraOptions) =>
                            onChangeAction(action, name, value, extraOptions)
                          }
                          onDelete={() => onRemoveAction(action)}
                          onAdd={() =>
                            addActionToSplitAfterIndex(splitIndex, actionIndex)
                          }
                          entityFields={entityFields}
                        />
                      </View>
                    ))}
                  </SpaceBetween>

                  {actions.length === 0 && (
                    <Button
                      style={{ alignSelf: 'flex-start', marginTop: 5 }}
                      onPress={() => addActionToSplitAfterIndex(splitIndex, -1)}
                    >
                      <Trans>Add action</Trans>
                    </Button>
                  )}
                </View>
              ))}
            </SpaceBetween>
            {showSplitButton && (
              <Button
                style={{ alignSelf: 'flex-start', marginTop: 15 }}
                onPress={() => {
                  addActionToSplitAfterIndex(actionSplits.length, -1);
                }}
                data-testid="add-split-transactions"
              >
                {actionSplits.length > 1
                  ? t('Add another split')
                  : t('Split into multiple transactions')}
              </Button>
            )}
          </View>
        </View>
      </View>

      <SelectedProvider instance={selectedInst}>
        <View
          style={{
            padding: '20px',
            flex: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <SpaceBetween
            gap={5}
            style={{
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: theme.pageTextLight, marginBottom: 0 }}>
              <Trans>This rule applies to these transactions:</Trans>
            </Text>

            <Button
              isDisabled={selectedInst.items.size === 0}
              onPress={onApply}
            >
              <Trans>Apply actions</Trans> ({selectedInst.items.size})
            </Button>
          </SpaceBetween>

          {/* Transaction preview removed for white-label version */}
          {transactions.length > 0 && (
            <View style={{
              border: '1px solid ' + theme.tableBorder,
              borderRadius: '6px 6px 0 0',
              padding: 10,
            }}>
              <Text>{transactions.length} matching entities</Text>
            </View>
          )}

          <SpaceBetween
            style={{
              marginTop: 20,
              justifyContent: onDelete ? 'space-between' : 'flex-end',
            }}
          >
            {onDelete && (
              <Button onPress={onDelete}>
                <Trans>Delete</Trans>
              </Button>
            )}

            <SpaceBetween>
              <Button onPress={onCancel}>
                <Trans>Cancel</Trans>
              </Button>
              <Button variant="primary" onPress={onSave}>
                <Trans>Save</Trans>
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </View>
      </SelectedProvider>
    </View>
  );
}
