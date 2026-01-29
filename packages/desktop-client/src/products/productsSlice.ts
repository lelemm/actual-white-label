import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { send } from 'loot-core/platform/client/fetch';
import { type ProductEntity } from 'loot-core/types/models';
import { createAppAsyncThunk } from '@desktop-client/redux';
import { resetApp } from '@desktop-client/app/appSlice';

const sliceName = 'products';

type ProductsState = {
  products: ProductEntity[];
  isProductsLoading: boolean;
  isProductsLoaded: boolean;
  isProductsDirty: boolean;
};

const initialState: ProductsState = {
  products: [],
  isProductsLoading: false,
  isProductsLoaded: false,
  isProductsDirty: false,
};

const productsSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    markProductsDirty(state) {
      state.isProductsDirty = true;
    },
    setProducts(state, action: PayloadAction<ProductEntity[]>) {
      state.products = action.payload;
      state.isProductsLoaded = true;
      state.isProductsDirty = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(resetApp, () => initialState);

    builder.addCase(getProducts.fulfilled, (state, action) => {
      state.products = action.payload;
      state.isProductsLoaded = true;
      state.isProductsDirty = false;
      state.isProductsLoading = false;
    });

    builder.addCase(getProducts.pending, state => {
      state.isProductsLoading = true;
    });

    builder.addCase(getProducts.rejected, state => {
      state.isProductsLoading = false;
    });

    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.products.push(action.payload);
      state.isProductsDirty = true;
    });

    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = { ...state.products[index], ...action.payload };
      }
      state.isProductsDirty = true;
    });

    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.products = state.products.filter(p => p.id !== action.payload);
      state.isProductsDirty = true;
    });
  },
});

export const getProducts = createAppAsyncThunk(
  `${sliceName}/getProducts`,
  async () => {
    const products: ProductEntity[] = await send('products-get');
    return products;
  },
  {
    condition: (_, { getState }) => {
      const { products } = getState();
      return (
        !products.isProductsLoading &&
        (products.isProductsDirty || !products.isProductsLoaded)
      );
    },
  },
);

export const createProduct = createAppAsyncThunk(
  `${sliceName}/createProduct`,
  async (product: Omit<ProductEntity, 'id'>) => {
    const id = await send('product-create', product);
    return { ...product, id };
  },
);

export const updateProduct = createAppAsyncThunk(
  `${sliceName}/updateProduct`,
  async ({ id, ...updates }: Partial<ProductEntity> & { id: string }) => {
    await send('product-update', { id, ...updates });
    return { id, ...updates };
  },
);

export const deleteProduct = createAppAsyncThunk(
  `${sliceName}/deleteProduct`,
  async (id: string) => {
    await send('product-delete', id);
    return id;
  },
);

export const { name, reducer, getInitialState } = productsSlice;
export const { setProducts, markProductsDirty } = productsSlice.actions;
