import type { Product } from '@/types/products';
import type { Bundle } from '@/types/bundles';
import type { SpecialOffer } from '@/types/special-offers';

export type CartItemType = 'product' | 'bundle' | 'special_offer';

export type CartBaseItem = {
  cartKey: string;
  id: string;
  type: CartItemType;
  title: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  videoUrl?: string | null; 
   isFreebie?: boolean; 
};

export type ProductCartItem = CartBaseItem & {
  type: 'product';
  product: Product;
};

export type BundleCartItem = CartBaseItem & {
  type: 'bundle';
  bundle: Bundle;
};

export type SpecialOfferCartItem = CartBaseItem & {
  type: 'special_offer';
  specialOffer: SpecialOffer;
};

export type CartItem = ProductCartItem | BundleCartItem | SpecialOfferCartItem;