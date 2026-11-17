import type { CartItem } from '@/types/cart';
import type { CheckoutFormValues, SavedAddress } from '@/types/order';
import type {
  CheckoutDiscountType,
  CheckoutItemPayload,
  CheckoutPayload,
} from '@/types/checkout';
import { calculateCheckoutSummary } from '@/lib/calculateCheckoutSummary';

function toSafeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toOptionalPositiveNumber(value: unknown) {
  const n = toSafeNumber(value);
  return n > 0 ? n : undefined;
}

function hasRealProductOffer(product: any) {
  if (!product) return false;

  const offerPrice = toOptionalPositiveNumber(product.offer_price);

  return offerPrice !== undefined;
}

function isCouponEligibleCartItem(item: CartItem) {
  if (item.type === 'bundle') return false;
  if (item.type === 'special_offer') return false;

  if (item.type === 'product' && hasRealProductOffer(item.product)) {
    return false;
  }

  return true;
}

function getItemOfferPrice(item: CartItem) {
  if (item.type !== 'product') return undefined;

  return toOptionalPositiveNumber(item.product?.offer_price);
}

function getComparePrice(item: CartItem) {
  if (item.type === 'product') {
    return toOptionalPositiveNumber(item.product?.comparePrice);
  }

  if (item.type === 'bundle') {
    return toOptionalPositiveNumber(item.bundle?.originTotal);
  }

  if (item.type === 'special_offer') {
    return toOptionalPositiveNumber(item.specialOffer?.originTotal);
  }

  return undefined;
}

function getOriginalPrice(item: CartItem) {
  return getComparePrice(item);
}

function allocateCouponValues(params: {
  items: CartItem[];
  discountType?: CheckoutDiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
}) {
  const {
    items,
    discountType,
    discountValue = 0,
    maxDiscountAmount,
  } = params;

  const eligibleItems = items.filter(
    (item) => isCouponEligibleCartItem(item) && !item.isFreebie
  );


  const eligibleLineTotals = eligibleItems.map((item) => ({
    cartKey: item.cartKey,
    lineTotal: toSafeNumber(item.price) * toSafeNumber(item.quantity, 1),
  }));

  const eligibleSubtotal = eligibleLineTotals.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  const couponMap = new Map<string, number>();

  if (!eligibleSubtotal || !discountType || discountValue <= 0) {
    return couponMap;
  }

  let totalDiscount = 0;

  if (discountType === 'percentage') {
    totalDiscount = eligibleSubtotal * (discountValue / 100);

    if (maxDiscountAmount && maxDiscountAmount > 0) {
      totalDiscount = Math.min(totalDiscount, maxDiscountAmount);
    }
  } else {
    totalDiscount = Math.min(discountValue, eligibleSubtotal);
  }

  totalDiscount = Number(totalDiscount.toFixed(2));

  if (totalDiscount <= 0) return couponMap;

  let allocated = 0;

  eligibleLineTotals.forEach((entry, index) => {
    if (index === eligibleLineTotals.length - 1) {
      couponMap.set(
        entry.cartKey,
        Number((totalDiscount - allocated).toFixed(2))
      );
      return;
    }

    const share = Number(
      ((entry.lineTotal / eligibleSubtotal) * totalDiscount).toFixed(2)
    );

    couponMap.set(entry.cartKey, share);
    allocated += share;
  });

  return couponMap;
}

function toCheckoutItems(params: {
  items: CartItem[];
  couponCode?: string;
  discountType?: CheckoutDiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
}) {
  const { items, couponCode, discountType, discountValue, maxDiscountAmount } = params;

  const isPercentage = discountType === 'percentage';
  const isFixed = discountType === 'fixed' || discountType === 'price';

  // For fixed coupons, allocate proportional dollar amounts (excluding freebies)
  const allocatedMap = (isFixed && discountValue && discountValue > 0)
    ? allocateCouponValues({ items, discountType, discountValue, maxDiscountAmount })
    : new Map<string, number>();

  return items.map((item): CheckoutItemPayload => {
    const isEligible = isCouponEligibleCartItem(item) && !item.isFreebie;
    const hasCouponApplied = Boolean(couponCode) && isEligible && discountValue && discountValue > 0;

    const price = toSafeNumber(item.price);
    const comparePrice = getComparePrice(item);
    const originalPrice = getOriginalPrice(item);
    const offerPrice = getItemOfferPrice(item);

    let couponValue: number | undefined;
    let discountTypeToSend: CheckoutDiscountType | undefined;

    if (hasCouponApplied && isPercentage) {
      couponValue = discountValue;
      discountTypeToSend = 'percentage';
    } else if (hasCouponApplied && isFixed) {
      couponValue = allocatedMap.get(item.cartKey);
      if (couponValue && couponValue > 0) {
        discountTypeToSend = discountType;
      }
    }

    return {
      item_type: item.type,
      item_id: Number(item.id),
      quantity: toSafeNumber(item.quantity, 1),
      price,
      offer_price: offerPrice,
      compare_price: comparePrice,
      original_price: originalPrice,
      coupon_value: couponValue,
      discount_type: discountTypeToSend,
      is_free: !!item.isFreebie,      // 🔸 NEW flag
    };
  });
}
export function buildCheckoutPayload(params: {
  values: CheckoutFormValues;
  items: CartItem[];
  selectedAddressId?: string | null;
  taxRatePercent?: number;
  taxRateId?: number | null;
  deliveryFee?: number;
  couponCode?: string;
  couponDiscountType?: CheckoutDiscountType;
  couponDiscountValue?: number;
  couponMaxDiscountAmount?: number;
  selectedAddress: SavedAddress;
}): CheckoutPayload {
const {
  values,
  items,
  selectedAddressId,
  taxRatePercent = 0,
  taxRateId = null,
  deliveryFee = 0,
  couponCode,
  couponDiscountType,
  couponDiscountValue,
  couponMaxDiscountAmount,
  selectedAddress, // ✅ ADD THIS
} = params;

  const normalizedCouponCode = couponCode?.trim().toUpperCase() || undefined;

const shippingAddress = [
  selectedAddress.address,
  selectedAddress.street,
  selectedAddress.city,
]
  .filter(Boolean)
  .join(', ');

  const eligibleCouponMap = allocateCouponValues({
    items,
    discountType: couponDiscountType,
    discountValue: couponDiscountValue,
    maxDiscountAmount: couponMaxDiscountAmount,
  });

  const totalCouponDiscount = Array.from(eligibleCouponMap.values()).reduce(
    (sum, value) => sum + value,
    0
  );

  const summary = calculateCheckoutSummary(
    items,
    deliveryFee,
    taxRatePercent,
    totalCouponDiscount
  );

  return {
    address_id: selectedAddressId ? Number(selectedAddressId) : null,
    delivery_zone_id: Number(values.deliveryZoneId),
    shipping_address: shippingAddress,
    subtotal: Number(summary.subtotal.toFixed(2)),
    delivery_fee: Number(summary.deliveryFee.toFixed(2)),
    shipping_cost: Number(summary.shippingCost.toFixed(2)),
    tax: Number(summary.tax.toFixed(2)),
    total: Number(summary.total.toFixed(2)),
    items: toCheckoutItems({
      items,
      couponCode: normalizedCouponCode,
      discountType: couponDiscountType,
      discountValue: couponDiscountValue,
      maxDiscountAmount: couponMaxDiscountAmount,
    }),
    coupon_code: normalizedCouponCode,
    payment_method: values.paymentMethod,
    tax_rate_id: taxRateId,
    billing_address: shippingAddress,
  };
}