import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Cell,
  SelectCell,
  TableHeader,
} from '@desktop-client/components/table';
import {
  useSelectedDispatch,
  useSelectedItems,
} from '@desktop-client/hooks/useSelected';

export function ProductsHeader() {
  const { t } = useTranslation();
  const selectedItems = useSelectedItems();
  const dispatchSelected = useSelectedDispatch();

  return (
    <TableHeader style={{}}>
      <SelectCell
        exposed
        focused={false}
        selected={selectedItems.size > 0}
        onSelect={e =>
          dispatchSelected({ type: 'select-all', isRangeSelect: e.shiftKey })
        }
      />
      <Cell value={t('Name')} width={200} />
      <Cell value={t('Description')} width="flex" />
      <Cell value={t('Price')} width={100} />
      <Cell value={t('Category')} width={150} />
    </TableHeader>
  );
}
