import type { Product } from '@/types/products';
import type { Bundle } from '@/types/bundles';
import type { SpecialOffer } from '@/types/special-offers';

export type RelatedSourceType = 'product' | 'bundle' | 'special_offer';
export type RelatedItemType = 'product' | 'bundle' | 'special_offer';

type RelatedBase = {
  id: string;
  sourceType: RelatedSourceType;
  sourceId: string;
  relatedType: RelatedItemType;
  relatedId: string;
  sortOrder: number;
  createdAt: string | null;
};

export type RelatedProductItem = RelatedBase & {
  relatedType: 'product';
  related: Product;
};

export type RelatedBundleItem = RelatedBase & {
  relatedType: 'bundle';
  related: Bundle;
};

export type RelatedSpecialOfferItem = RelatedBase & {
  relatedType: 'special_offer';
  related: SpecialOffer;
};

export type RelatedItem =
  | RelatedProductItem
  | RelatedBundleItem
  | RelatedSpecialOfferItem;

export type GetRelatedItemsParams = {
  source_id: string;
  source_type: RelatedSourceType;
};