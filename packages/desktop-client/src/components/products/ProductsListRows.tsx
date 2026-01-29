import React from 'react';

import { View } from '@actual-app/components/view';

import { type ProductEntity } from 'loot-core/types/models';

import { ProductRow } from './ProductRow';

type ProductsListRowsProps = {
  products: ProductEntity[];
  selectedItems: Set<string>;
  hoveredProduct?: string;
  onHover?: (id: string | null) => void;
  onEditProduct?: (product: ProductEntity) => void;
  onDeleteProduct?: (product: ProductEntity) => void;
};

export function ProductsListRows({
  products,
  selectedItems,
  hoveredProduct,
  onHover,
  onEditProduct,
  onDeleteProduct,
}: ProductsListRowsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <View>
      {products.map(product => {
        const hovered = hoveredProduct === product.id;
        const selected = selectedItems.has(product.id);

        return (
          <ProductRow
            key={product.id}
            product={product}
            hovered={hovered}
            selected={selected}
            onHover={onHover}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
          />
        );
      })}
    </View>
  );
}
