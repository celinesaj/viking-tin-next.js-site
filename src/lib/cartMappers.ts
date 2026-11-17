import type { CartItem } from '@/types/cart';

export function mapCartItemsToCheckoutItems(items: CartItem[] | undefined) {
  const safeItems = Array.isArray(items) ? items : [];

  return safeItems
    .filter((item) => item.type === 'product')
    .map((item) => ({
      itemType: 'product' as const,
      itemId: String(item.id),
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.price ?? 0),
      discountApplied: 0,
    }));
}