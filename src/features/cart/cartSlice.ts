// features/cart/cartSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Bundle } from '@/types/bundles';
import type { CartItem, ProductCartItem } from '@/types/cart';
import type { Product } from '@/types/products';
import type { SpecialOffer } from '@/types/special-offers';
import type { FreebieProduct } from '@/types/freebie';   // 🔸 new import

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

function makeCartKey(type: CartItem['type'], id: string) {
  return `${type}-${id}`;
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getProductFinalPrice(product: Product, overridePrice?: number) {
  if (overridePrice !== undefined) return toNumber(overridePrice);

  const offerPrice =
    (product as any).offer_price ??
    (product as any).offerPrice ??
    null;

  if (
    offerPrice !== null &&
    offerPrice !== undefined &&
    offerPrice !== '' &&
    toNumber(offerPrice) > 0
  ) {
    return toNumber(offerPrice);
  }

  return toNumber(product.price);
}

function getProductOriginalPrice(product: Product) {
  const comparePrice =
    (product as any).comparePrice ??
    (product as any).compare_price ??
    null;

  if (
    comparePrice !== null &&
    comparePrice !== undefined &&
    comparePrice !== '' &&
    toNumber(comparePrice) > 0
  ) {
    return toNumber(comparePrice);
  }

  return toNumber(product.price);
}

function productHasOffer(product: Product, finalPrice: number) {
  const offerPrice =
    (product as any).offer_price ??
    (product as any).offerPrice ??
    null;

  const offerPercentage =
    (product as any).offer_percentage ??
    (product as any).offerPercentage ??
    null;

  const comparePrice =
    (product as any).comparePrice ??
    (product as any).compare_price ??
    null;

  if (
    offerPrice !== null &&
    offerPrice !== undefined &&
    offerPrice !== '' &&
    toNumber(offerPrice) > 0
  ) {
    return true;
  }

  if (
    offerPercentage !== null &&
    offerPercentage !== undefined &&
    offerPercentage !== '' &&
    toNumber(offerPercentage) > 0
  ) {
    return true;
  }

  if (
    comparePrice !== null &&
    comparePrice !== undefined &&
    comparePrice !== '' &&
    toNumber(comparePrice) > finalPrice
  ) {
    return true;
  }

  return false;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },

   addProductToCart: (
  state,
  action: PayloadAction<{
    product: Product;
    price?: number;
  }>
) => {
  const { product, price } = action.payload;
  const cartKey = makeCartKey('product', product.id);

  const existingItem = state.items.find((item) => item.cartKey === cartKey);

  if (existingItem) {
    // Guard against exceeding stock
    if (existingItem.quantity + 1 > product.stock) {
      return; // silently ignore – component already prevents, but safe
    }
    existingItem.quantity += 1;
    return;
  }

  const finalPrice = getProductFinalPrice(product, price);
  const originalPrice = getProductOriginalPrice(product);
  const hasOffer = productHasOffer(product, finalPrice);

  state.items.push({
    cartKey,
    id: product.id,
    videoUrl: (product as any).coverGifUrl ?? null,
    type: 'product',
    title: product.name,
    slug: product.slug,
    imageUrl: product.media?.[0]?.url ?? null,
    price: finalPrice,
    quantity: 1,
    product: {
      ...product,
      original_price: originalPrice,
      has_offer: hasOffer,
    } as any,
  });
},
    addBundleToCart: (
      state,
      action: PayloadAction<{
        bundle: Bundle;
        price?: number;
      }>
    ) => {
      const { bundle, price } = action.payload;
      const cartKey = makeCartKey('bundle', bundle.id);

      const existingItem = state.items.find((item) => item.cartKey === cartKey);

      if (existingItem) {
        existingItem.quantity += 1;
        return;
      }

      state.items.push({
        cartKey,
        id: bundle.id,
        type: 'bundle',
        title: bundle.name,
        slug: bundle.slug,
        imageUrl: bundle.imageUrl ?? bundle.galleryImages?.[0]?.url ?? null,
        price: price ?? toNumber(bundle.price),
        quantity: 1,
        bundle,
      });
    },

    addSpecialOfferToCart: (
      state,
      action: PayloadAction<{
        specialOffer: SpecialOffer;
        price?: number;
      }>
    ) => {
      const { specialOffer, price } = action.payload;
      const cartKey = makeCartKey('special_offer', specialOffer.id);

      const existingItem = state.items.find((item) => item.cartKey === cartKey);

      if (existingItem) {
        existingItem.quantity += 1;
        return;
      }

      state.items.push({
        cartKey,
        id: specialOffer.id,
        type: 'special_offer',
        title: specialOffer.name,
        slug: specialOffer.slug,
        imageUrl:
          specialOffer.imageUrl ?? specialOffer.galleryImages?.[0]?.url ?? null,
        price: price ?? toNumber(specialOffer.price),
        quantity: 1,
        specialOffer,
      });
    },

    // 🔸 NEW: Add freebie products to cart (price 0, marked as isFreebie)
    addFreebieToCart: (state, action: PayloadAction<FreebieProduct[]>) => {
      const products = action.payload;
      for (const product of products) {
        const cartKey = `freebie-${product.id}`;
        const exists = state.items.some(item => item.cartKey === cartKey);
        if (!exists) {
          // Create a ProductCartItem stub with minimal required fields.
          // Adjust the 'product' property if your Product type has mandatory fields.
          const freebieItem: ProductCartItem = {
            cartKey,
            id: product.id,
            videoUrl: null,
            type: 'product',
            title: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl,
            price: 0,
            quantity: 1,
            isFreebie: true,                // mark as free gift
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: 0,
              is_active: true,
              // Add any other required Product fields with default/placeholder values
              // to satisfy your Product type (e.g., brand_id, created_at, etc.)
            } as any,
          };
          state.items.push(freebieItem);
        }
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.cartKey !== action.payload
      );
    },

   increaseQuantity: (state, action: PayloadAction<string>) => {
  const item = state.items.find(
    (cartItem) => cartItem.cartKey === action.payload
  );

  if (!item) return;

  // Only enforce stock for product items
  if (item.type === 'product') {
    const product = (item as ProductCartItem).product;
    const stock = product?.stock ?? Infinity;
    if (item.quantity + 1 > stock) {
      // Optionally, we could dispatch a toast from a middleware, but to keep slice pure we just return.
      // The UI will show an error when the action fails silently.
      return;
    }
  }

  item.quantity += 1;
},
    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (cartItem) => cartItem.cartKey === action.payload
      );

      if (!item) return;

      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter(
          (cartItem) => cartItem.cartKey !== action.payload
        );
      }
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addProductToCart,
  addBundleToCart,
  addSpecialOfferToCart,
  addFreebieToCart,       // 🔸 export new action
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;