import React, { type CSSProperties } from 'react';

import { Text } from '@actual-app/components/text';

// White-label version: Simple Value component for displaying rule values
export function Value({
  value,
  style,
  field,
  inline,
  valueIsRaw,
}: {
  value: unknown;
  style?: CSSProperties;
  field?: unknown;
  inline?: boolean;
  valueIsRaw?: boolean;
}) {
  return <Text style={style}>{String(value ?? '')}</Text>;
}
