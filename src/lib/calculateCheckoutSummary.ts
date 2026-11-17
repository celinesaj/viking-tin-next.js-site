import type { CartItem } from '@/types/cart';
import { calculateCartSummary } from '@/lib/cartPricing';

function toSafeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function calculateCheckoutSummary(
  items: CartItem[] | undefined,
  deliveryFee = 0,
  taxRatePercent = 0,
  discountAmount = 0
) {
  const safeDeliveryFee = toSafeNumber(deliveryFee);
  // 🔸 Exclude free items from summary calculations
  const nonFreeItems = (items ?? []).filter((item) => !item.isFreebie);
  const cartSummary = calculateCartSummary(
    nonFreeItems,
    taxRatePercent,
    discountAmount
  );

  return {
    subtotal: Number(cartSummary.subtotal.toFixed(2)),
    discount: Number(cartSummary.discount.toFixed(2)),
    tax: Number(cartSummary.tax.toFixed(2)),
    deliveryFee: Number(safeDeliveryFee.toFixed(2)),
    shippingCost: Number(safeDeliveryFee.toFixed(2)),
    total: Number((cartSummary.total + safeDeliveryFee).toFixed(2)),
  };
}