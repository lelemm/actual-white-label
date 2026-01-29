import React, { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import {
  friendlyOp,
  getAllocationMethods,
  mapField,
} from 'loot-core/shared/rules';
import {
  type RuleActionEntity,
  type SetRuleActionEntity,
  type DeleteEntityRuleActionEntity,
} from 'loot-core/types/models';

// White-label version: Value component removed, using simple text display
function Value({ value, style, field }: { value: unknown; style?: CSSProperties; field?: string }) {
  return <Text style={style}>{String(value ?? '')}</Text>;
}

const valueStyle = {
  color: theme.pillTextHighlighted,
};

type ActionExpressionProps = RuleActionEntity & {
  style?: CSSProperties;
};

export function ActionExpression({ style, ...props }: ActionExpressionProps) {
  return (
    <View
      style={{
        display: 'block',
        maxWidth: '100%',
        color: theme.pillText,
        backgroundColor: theme.pillBackgroundLight,
        borderRadius: 4,
        padding: '3px 5px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...style,
      }}
    >
      {props.op === 'set' ? (
        <SetActionExpression {...(props as SetRuleActionEntity)} />
      ) : props.op === 'delete-entity' ? (
        <DeleteEntityActionExpression {...(props as DeleteEntityRuleActionEntity)} />
      ) : null}
    </View>
  );
}

function SetActionExpression({
  op,
  field,
  value,
  options,
}: SetRuleActionEntity) {
  const { t } = useTranslation();
  return (
    <>
      <Text>{friendlyOp(op)}</Text>{' '}
      <Text style={valueStyle}>{mapField(field, options)}</Text>{' '}
      <Text>{t('to ')}</Text>
      {options?.formula ? (
        <>
          <Text>{t('formula ')}</Text>
          <Text style={valueStyle}>{options.formula}</Text>
        </>
      ) : options?.template ? (
        <>
          <Text>{t('template ')}</Text>
          <Text style={valueStyle}>{options.template}</Text>
        </>
      ) : (
        <Value style={valueStyle} value={value} field={field} />
      )}
    </>
  );
}

function DeleteEntityActionExpression({
  op,
}: DeleteEntityRuleActionEntity) {
  return <Text>{friendlyOp(op)}</Text>;
}
