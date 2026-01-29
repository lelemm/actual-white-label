import React, { memo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { theme } from '@actual-app/components/theme';

import { type ProductEntity } from 'loot-core/types/models';

import { Cell, Row, SelectCell } from '@desktop-client/components/table';
import { useContextMenu } from '@desktop-client/hooks/useContextMenu';
import { useSelectedDispatch } from '@desktop-client/hooks/useSelected';

type ProductRowProps = {
  product: ProductEntity;
  hovered?: boolean;
  selected?: boolean;
  onHover?: (id: string | null) => void;
  onEditProduct?: (product: ProductEntity) => void;
  onDeleteProduct?: (product: ProductEntity) => void;
};

export const ProductRow = memo(
  ({
    product,
    hovered,
    selected,
    onHover,
    onEditProduct,
    onDeleteProduct,
  }: ProductRowProps) => {
    const dispatchSelected = useSelectedDispatch();
    const borderColor = selected ? theme.tableBorderSelected : 'none';
    const backgroundFocus = hovered;

    const { t } = useTranslation();

    const triggerRef = useRef(null);
    const { setMenuOpen, menuOpen, handleContextMenu, position } =
      useContextMenu();

    return (
      <Row
        ref={triggerRef}
        height="auto"
        style={{
          fontSize: 13,
          zIndex: selected ? 101 : 'auto',
          borderColor,
          backgroundColor: selected
            ? theme.tableRowBackgroundHighlight
            : backgroundFocus
              ? theme.tableRowBackgroundHover
              : theme.tableBackground,
        }}
        collapsed
        onMouseEnter={() => onHover && onHover(product.id)}
        onMouseLeave={() => onHover && onHover(null)}
        onContextMenu={handleContextMenu}
      >
        <Popover
          triggerRef={triggerRef}
          placement="bottom start"
          isOpen={menuOpen}
          onOpenChange={() => setMenuOpen(false)}
          {...position}
          style={{ width: 200, margin: 1 }}
          isNonModal
        >
          <Menu
            items={[
              onEditProduct && { name: 'edit', text: t('Edit') },
              onDeleteProduct && { name: 'delete', text: t('Delete') },
            ]}
            onMenuSelect={name => {
              switch (name) {
                case 'delete':
                  onDeleteProduct(product);
                  break;
                case 'edit':
                  onEditProduct(product);
                  break;
                default:
                  throw new Error(`Unrecognized menu option: ${name}`);
              }
              setMenuOpen(false);
            }}
          />
        </Popover>
        <SelectCell
          exposed={hovered || selected}
          focused
          onSelect={e => {
            dispatchSelected({
              type: 'select',
              id: product.id,
              isRangeSelect: e.shiftKey,
            });
          }}
          selected={selected}
        />

        <Cell name="name" width={200} plain style={{ color: theme.tableText }}>
          {product.name}
        </Cell>

        <Cell name="description" width="flex" plain style={{ color: theme.tableText }}>
          {product.description || ''}
        </Cell>

        <Cell name="price" width={100} plain style={{ color: theme.tableText }}>
          {product.price != null ? `$${product.price.toFixed(2)}` : ''}
        </Cell>

        <Cell name="category" width={150} plain style={{ color: theme.tableText }}>
          {product.category || ''}
        </Cell>

        <Cell name="edit" plain style={{ padding: '0 15px', paddingLeft: 5 }}>
          <Button onPress={() => onEditProduct(product)}>
            <Trans>Edit</Trans>
          </Button>
        </Cell>
      </Row>
    );
  },
);

ProductRow.displayName = 'ProductRow';
