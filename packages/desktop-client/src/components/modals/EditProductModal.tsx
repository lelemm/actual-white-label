import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { SpaceBetween } from '@actual-app/components/space-between';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { type ProductEntity } from 'loot-core/types/models';

import {
  Modal,
  ModalCloseButton,
  ModalHeader,
} from '@desktop-client/components/common/Modal';
import {
  FormField,
  FormLabel,
} from '@desktop-client/components/forms';
import {
  popModal,
  type Modal as ModalType,
} from '@desktop-client/modals/modalsSlice';
import { updateProduct } from '@desktop-client/products/productsSlice';
import { useDispatch } from '@desktop-client/redux';

type EditProductModalProps = Extract<
  ModalType,
  { name: 'edit-product' }
>['options'];

export function EditProductModal({
  product: defaultProduct,
  onSave: originalOnSave,
}: EditProductModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [name, setName] = useState(defaultProduct.name);
  const [description, setDescription] = useState(defaultProduct.description || '');
  const [price, setPrice] = useState(defaultProduct.price?.toString() || '0');
  const [category, setCategory] = useState(defaultProduct.category || '');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('Product name is required.'));
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setError(t('Please enter a valid price.'));
      return;
    }

    const updatedProduct: ProductEntity = {
      ...defaultProduct,
      name: name.trim(),
      description: description.trim(),
      price: priceValue,
      category: category.trim(),
    };

    await dispatch(updateProduct(updatedProduct));
    originalOnSave?.(updatedProduct);
    dispatch(popModal());
  };

  return (
    <Modal name="edit-product">
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={t('Edit Product')}
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <View style={{ padding: '0 10px' }}>
            <SpaceBetween style={{ marginTop: 10 }}>
              <FormField style={{ flex: 1 }}>
                <FormLabel title={t('Name')} htmlFor="product-name-field" />
                <Input
                  id="product-name-field"
                  value={name}
                  onChangeValue={setName}
                  style={{ borderColor: theme.buttonMenuBorder }}
                />
              </FormField>
            </SpaceBetween>

            <SpaceBetween style={{ marginTop: 10 }}>
              <FormField style={{ flex: 1 }}>
                <FormLabel title={t('Description')} htmlFor="product-description-field" />
                <Input
                  id="product-description-field"
                  value={description}
                  onChangeValue={setDescription}
                  placeholder={t('(Optional)')}
                  style={{ borderColor: theme.buttonMenuBorder }}
                />
              </FormField>
            </SpaceBetween>

            <SpaceBetween style={{ marginTop: 10, gap: 10 }}>
              <FormField style={{ flex: 1 }}>
                <FormLabel title={t('Price')} htmlFor="product-price-field" />
                <Input
                  id="product-price-field"
                  type="number"
                  value={price}
                  onChangeValue={setPrice}
                  style={{ borderColor: theme.buttonMenuBorder }}
                />
              </FormField>

              <FormField style={{ flex: 1 }}>
                <FormLabel title={t('Category')} htmlFor="product-category-field" />
                <Input
                  id="product-category-field"
                  value={category}
                  onChangeValue={setCategory}
                  placeholder={t('(Optional)')}
                  style={{ borderColor: theme.buttonMenuBorder }}
                />
              </FormField>
            </SpaceBetween>

            <SpaceBetween
              gap={10}
              style={{
                marginTop: 20,
                marginBottom: 10,
                justifyContent: 'flex-end',
              }}
            >
              {error && <Text style={{ color: theme.errorText }}>{error}</Text>}
              <Button variant="bare" onPress={close}>
                <Trans>Cancel</Trans>
              </Button>
              <Button variant="primary" onPress={handleSave}>
                <Trans>Save</Trans>
              </Button>
            </SpaceBetween>
          </View>
        </>
      )}
    </Modal>
  );
}
