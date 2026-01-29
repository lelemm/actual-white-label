import { type RuleTarget } from '../rules-entity';

export type NewProductEntity = {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  created_date?: string;
  tombstone?: boolean;
};

export type ProductEntity = {
  id: string;
} & NewProductEntity;

// Implement RuleTarget interface for rules support
export function productToRuleTarget(product: ProductEntity): RuleTarget {
  return {
    id: product.id,
    date: product.created_date,
    notes: product.description,
    ...product,
  };
}
