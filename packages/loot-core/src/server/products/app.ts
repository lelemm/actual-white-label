import { createApp } from '../app';
import { mutator } from '../mutators';
import { undoable } from '../undo';
import * as db from '../db';
import { type ProductEntity, type NewProductEntity } from '../../types/models';

export type ProductsHandlers = {
  'products-get': typeof getProducts;
  'product-get': typeof getProduct;
  'product-create': typeof createProduct;
  'product-update': typeof updateProduct;
  'product-delete': typeof deleteProduct;
};

export const app = createApp<ProductsHandlers>();

app.method('products-get', getProducts);
app.method('product-get', getProduct);
app.method('product-create', mutator(undoable(createProduct)));
app.method('product-update', mutator(undoable(updateProduct)));
app.method('product-delete', mutator(undoable(deleteProduct)));

async function getProducts(): Promise<ProductEntity[]> {
  return await db.all<ProductEntity>(
    `SELECT * FROM products WHERE tombstone = 0 ORDER BY name`,
  );
}

async function getProduct(id: string): Promise<ProductEntity | null> {
  return await db.first<ProductEntity>(
    `SELECT * FROM products WHERE id = ? AND tombstone = 0`,
    [id],
  );
}

async function createProduct(product: NewProductEntity): Promise<string> {
  const id = await db.insertWithUUID('products', {
    ...product,
    created_date:
      product.created_date || new Date().toISOString().split('T')[0],
  });
  return id;
}

async function updateProduct({
  id,
  ...updates
}: Partial<ProductEntity> & { id: string }): Promise<void> {
  await db.update('products', { id, ...updates });
}

async function deleteProduct(id: string): Promise<void> {
  await db.update('products', { id, tombstone: 1 });
}
