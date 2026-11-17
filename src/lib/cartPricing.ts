import type { CartItem } from '@/types/cart';

function toSafeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ─── Offer detection ───────────────────────────────────────────────────────

export function hasRealProductOffer(product: any) {
  if (!product) return false;

  // Trust the backend's computed flag first
  if (product.has_offer === true) return true;

  return (
    (product.offer_price !== null &&
      product.offer_price !== undefined &&
      product.offer_price !== '' &&
      Number(product.offer_price) > 0) ||
    (product.offer_percentage !== null &&
      product.offer_percentage !== undefined &&
      product.offer_percentage !== '' &&
      Number(product.offer_percentage) > 0) ||
    (product.offer_discount_amount !== null &&
      product.offer_discount_amount !== undefined &&
      product.offer_discount_amount !== '' &&
      Number(product.offer_discount_amount) > 0)
  );
}

export function isCouponEligibleCartItem(item: CartItem) {
  if (item.type === 'bundle') return false;
  if (item.type === 'special_offer') return false;
    if (item.isFreebie) return false;
  if (item.type === 'product' && hasRealProductOffer((item as any).product))
    return false;
  return true;
}

// ─── Coupon type ───────────────────────────────────────────────────────────

export type AppliedCoupon = {
  code: string;
  // Normalised: backend may return "price" or "fixed" — both mean fixed amount
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
};

/**
 * Normalise the discount_type coming from the API.
 * Backend returns "price" or "fixed" for a fixed-amount coupon.
 */
export function normaliseDiscountType(
  raw: string | undefined | null
): 'fixed' | 'percentage' {
  if (raw === 'fixed' || raw === 'price') return 'fixed';
  return 'percentage';
}

// ─── Split cart into eligible / non-eligible ───────────────────────────────

export function splitCartByEligibility(items: CartItem[]) {
  const eligible: CartItem[] = [];
  const nonEligible: CartItem[] = [];

  for (const item of items) {
    if (isCouponEligibleCartItem(item)) {
      eligible.push(item);
    } else {
      nonEligible.push(item);
    }
  }

  const eligibleSubtotal = eligible.reduce(
    (sum, item) =>
      sum + toSafeNumber(item.price) * toSafeNumber(item.quantity),
    0
  );

  const nonEligibleSubtotal = nonEligible.reduce(
    (sum, item) =>
      sum + toSafeNumber(item.price) * toSafeNumber(item.quantity),
    0
  );

  return { eligible, nonEligible, eligibleSubtotal, nonEligibleSubtotal };
}

// ─── Pro-rata discount distribution ───────────────────────────────────────

export function distributeDiscount(
  eligibleItems: CartItem[],
  eligibleSubtotal: number,
  coupon: AppliedCoupon
): { perItem: Map<string, number>; totalDiscount: number } {
  const perItem = new Map<string, number>();

  // Guard: nothing to distribute
  if (eligibleSubtotal <= 0 || eligibleItems.length === 0) {
    return { perItem, totalDiscount: 0 };
  }

  // ── Compute raw discount ──────────────────────────────────────────────────
  let rawDiscount = 0;

  if (coupon.discount_type === 'percentage') {
    const rate = toSafeNumber(coupon.discount_value);

    // Validation: percentage must be > 0 and ≤ 100
    if (rate <= 0 || rate > 100) {
      return { perItem, totalDiscount: 0 };
    }

    rawDiscount = eligibleSubtotal * (rate / 100);
  } else {
    // fixed
    const amount = toSafeNumber(coupon.discount_value);

    // Validation: fixed amount must be > 0
    if (amount <= 0) {
      return { perItem, totalDiscount: 0 };
    }

    // Cap at eligible subtotal so discount never exceeds what's owed
    rawDiscount = Math.min(amount, eligibleSubtotal);
  }

  // Apply max_discount_amount cap
  if (
    coupon.max_discount_amount !== undefined &&
    coupon.max_discount_amount > 0
  ) {
    rawDiscount = Math.min(rawDiscount, coupon.max_discount_amount);
  }

  // Final guard: discount must be > 0 after all caps
  if (rawDiscount <= 0) {
    return { perItem, totalDiscount: 0 };
  }

  const totalDiscount = Number(rawDiscount.toFixed(2));

  // ── Pro-rata distribution ─────────────────────────────────────────────────
  let distributed = 0;

  eligibleItems.forEach((item, index) => {
    const itemTotal =
      toSafeNumber(item.price) * toSafeNumber(item.quantity);

    const isLast = index === eligibleItems.length - 1;

    // Last item absorbs the remainder to avoid rounding drift
    const itemDiscount = isLast
      ? Number((totalDiscount - distributed).toFixed(2))
      : Number(
          ((itemTotal / eligibleSubtotal) * totalDiscount).toFixed(2)
        );

    // Per-item discount must never be negative
    perItem.set(item.cartKey, Math.max(itemDiscount, 0));
    distributed += itemDiscount;
  });

  return { perItem, totalDiscount };
}

// ─── Basic summary (backwards-compatible) ─────────────────────────────────

export function calculateCartSummary(
  items: CartItem[] | undefined,
  taxRatePercent = 0,
  discountAmount = 0
) {
  const safeItems = Array.isArray(items) ? items : [];

  const subtotal = safeItems.reduce((sum, item) => {
    const price = toSafeNumber(item?.price);
    const quantity = toSafeNumber(item?.quantity);
    return sum + price * quantity;
  }, 0);

  // Discount must be > 0 and not exceed subtotal
  const discount = Math.min(
    Math.max(toSafeNumber(discountAmount), 0),
    subtotal
  );

  const taxableAmount = Math.max(subtotal - discount, 0);
  const taxRateDecimal = toSafeNumber(taxRatePercent) / 100;
  const tax = Number((taxableAmount * taxRateDecimal).toFixed(2));
  const total = Number((taxableAmount + tax).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax,
    total,
  };
}

// ─── Extended summary with eligible/non-eligible split ────────────────────

export function calculateCartSummaryWithSplit(
  items: CartItem[] | undefined,
  taxRatePercent = 0,
  coupon?: AppliedCoupon | null
) {
  const safeItems = Array.isArray(items) ? items : [];

  const { eligible, nonEligible, eligibleSubtotal, nonEligibleSubtotal } =
    splitCartByEligibility(safeItems);

  const { perItem, totalDiscount } =
    coupon && toSafeNumber(coupon.discount_value) > 0
      ? distributeDiscount(eligible, eligibleSubtotal, coupon)
      : { perItem: new Map<string, number>(), totalDiscount: 0 };

  const subtotal = Number((eligibleSubtotal + nonEligibleSubtotal).toFixed(2));

  // Discount must never exceed subtotal
  const discount = Number(
    Math.min(Math.max(totalDiscount, 0), subtotal).toFixed(2)
  );

  const taxableAmount = Math.max(subtotal - discount, 0);
  const taxRateDecimal = toSafeNumber(taxRatePercent) / 100;
  const tax = Number((taxableAmount * taxRateDecimal).toFixed(2));

  // Total must never be negative
  const total = Math.max(
    Number((taxableAmount + tax).toFixed(2)),
    0
  );

  return {
    subtotal,
    discount,
    tax,
    total,
    eligibleSubtotal: Number(eligibleSubtotal.toFixed(2)),
    nonEligibleSubtotal: Number(nonEligibleSubtotal.toFixed(2)),
    perItemDiscount: perItem,
    eligibleItems: eligible,
    nonEligibleItems: nonEligible,
  };
}