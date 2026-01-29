import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SpaceBetween } from '@actual-app/components/space-between';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { getNormalisedString } from 'loot-core/shared/normalisation';
import { type ProductEntity } from 'loot-core/types/models';

import { InfiniteScrollWrapper } from '@desktop-client/components/common/InfiniteScrollWrapper';
import { Search } from '@desktop-client/components/common/Search';
import {
  SelectedProvider,
  useSelected,
} from '@desktop-client/hooks/useSelected';
import { pushModal } from '@desktop-client/modals/modalsSlice';
import {
  createProduct,
  deleteProduct,
  getProducts,
} from '@desktop-client/products/productsSlice';
import { useDispatch, useSelector } from '@desktop-client/redux';

import { ProductsHeader } from './ProductsHeader';
import { ProductsListRows } from './ProductsListRows';

function productToString(product: ProductEntity) {
  return [
    product.name || '',
    product.description || '',
    product.category || '',
    product.price != null ? String(product.price) : '',
  ].join(' ');
}

type ProductsListContentProps = {
  isModal?: boolean;
};

function ProductsListContent({ isModal = false }: ProductsListContentProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { products, isProductsLoading } = useSelector(state => state.products);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const filtered =
      filter === ''
        ? products
        : products.filter(product =>
            getNormalisedString(productToString(product)).includes(
              getNormalisedString(filter),
            ),
          );
    return filtered.slice(0, 100 + page * 50);
  }, [products, filter, page]);

  const selectedInst = useSelected('manage-products', filteredProducts, []);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const onSearchChange = (value: string) => {
    setFilter(value);
    setPage(0);
  };

  function loadMore() {
    setPage(page => page + 1);
  }

  const onDeleteSelected = async () => {
    for (const id of selectedInst.items) {
      dispatch(deleteProduct(id));
    }
    selectedInst.dispatch({ type: 'select-none' });
  };

  const onDeleteProduct = (product: ProductEntity) => {
    dispatch(deleteProduct(product.id));
  };

  const onEditProduct = (product: ProductEntity) => {
    dispatch(
      pushModal({
        modal: {
          name: 'edit-product',
          options: {
            product,
          },
        },
      }),
    );
  };

  const onCreateProduct = () => {
    dispatch(
      createProduct({
        name: 'New Product',
        description: '',
        price: 0,
        category: '',
      }),
    );
  };

  const onHover = (id: string | null) => {
    setHoveredProduct(id);
  };

  if (isProductsLoading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>
          <Trans>Loading...</Trans>
        </Text>
      </View>
    );
  }

  return (
    <SelectedProvider instance={selectedInst}>
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: isModal ? '0 13px 15px' : '0 0 15px',
            flexShrink: 0,
          }}
        >
          <View
            style={{
              color: theme.pageTextLight,
              flexDirection: 'row',
              alignItems: 'center',
              width: '50%',
            }}
          >
            <Text>
              <Trans>
                Manage your products here.
              </Trans>
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Search
            placeholder={t('Filter products...')}
            value={filter}
            onChange={onSearchChange}
          />
        </View>
        <View style={styles.tableContainer}>
          <ProductsHeader />
          <InfiniteScrollWrapper loadMore={loadMore}>
            {filteredProducts.length === 0 ? (
              <EmptyMessage text={t('No products')} style={{ marginTop: 15 }} />
            ) : (
              <ProductsListRows
                products={filteredProducts}
                selectedItems={selectedInst.items}
                hoveredProduct={hoveredProduct}
                onHover={onHover}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
              />
            )}
          </InfiniteScrollWrapper>
        </View>
        <View
          style={{
            paddingBlock: 15,
            paddingInline: isModal ? 13 : 0,
            borderTop: isModal && '1px solid ' + theme.pillBorder,
            flexShrink: 0,
          }}
        >
          <SpaceBetween gap={10} style={{ justifyContent: 'flex-end' }}>
            {selectedInst.items.size > 0 && (
              <Button onPress={onDeleteSelected}>
                <Trans count={selectedInst.items.size}>
                  Delete {{ count: selectedInst.items.size }} products
                </Trans>
              </Button>
            )}
            <Button variant="primary" onPress={onCreateProduct}>
              <Trans>Create new product</Trans>
            </Button>
          </SpaceBetween>
        </View>
      </View>
    </SelectedProvider>
  );
}

function EmptyMessage({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <View
      style={{
        textAlign: 'center',
        color: theme.pageTextSubdued,
        fontStyle: 'italic',
        fontSize: 13,
        marginTop: 5,
        ...style,
      }}
    >
      {text}
    </View>
  );
}

export function ProductsList() {
  const { t } = useTranslation();
  return (
    <View style={{ ...styles.page, flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginLeft: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            fontSize: 25,
            fontWeight: 500,
          }}
        >
          <Text>{t('Products')}</Text>
        </View>
      </View>
      <View
        role="main"
        style={{
          flex: 1,
          padding: '0 20px',
        }}
      >
        <ProductsListContent isModal={false} />
      </View>
    </View>
  );
}
