// lib/mapCheckoutOrderInvoiceResponseToInvoiceData.ts

import type { InvoiceData, InvoiceItem } from '@/types/invoice';
import { formatInvoiceDate } from '@/lib/invoiceFormat';

export type CheckoutOrderInvoiceApiPayload = {
  order_number: string;
  invoice_number: string;
  created_at?: string | null;
  shipping_address?: string | null;
  billing_address?: string | null;
  payment_method?: string | null;
  subtotal: string;
  subtotal_after_coupon?: string;
  delivery_fee?: string | null;
  shipping_cost?: string | null;
  tax: string;
  total: string;
  coupon_discount?: string | null;
  applied_coupon_code?: string | null;
  discount_type?: 'percentage' | 'price' | null;   // global coupon type
  items: CheckoutOrderInvoiceApiLine[];
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

export type CheckoutOrderInvoiceApiLine = {
  id: string;
  item_type: string;
  quantity: number;
  unit_price: string;
  offer_price?: string | null;
  original_price?: string | null;
  coupon_value?: string | null;
  discount_type?: string | null;
  item_name?: string | null;
};

function toNum(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapLineItemType(itemType: string): InvoiceItem['type'] {
  if (itemType === 'product' || itemType === 'bundle' || itemType === 'special_offer') {
    return itemType;
  }
  return 'other';
}

/**
 * Checks if an item is eligible for coupon discount.
 * (Same logic as cart eligibility – products without offer, not bundles/special offers)
 */
function isItemEligibleForCoupon(row: CheckoutOrderInvoiceApiLine): boolean {
  if (row.item_type === 'bundle') return false;
  if (row.item_type === 'special_offer') return false;
  // If offer_price is present and lower than unit_price, it's an offer item – ineligible
  const unitPrice = toNum(row.unit_price);
  const offerPrice = toNum(row.offer_price);
  if (offerPrice > 0 && offerPrice < unitPrice) return false;
  return true;
}

/**
 * Compute discount and final amount for a single line item.
 * Uses per‑item discount_type and coupon_value when available.
 */
function computeItemDiscount(row: CheckoutOrderInvoiceApiLine): {
  discountPercent?: number;
  discountAmount?: number;
  amount: number;
} {
  const qty = Math.max(0, Number(row.quantity) || 0);
  const unitPrice = toNum(row.offer_price ?? row.unit_price);
  const gross = unitPrice * qty;

  const discountType = row.discount_type?.toLowerCase();
  const couponVal = toNum(row.coupon_value);

  // Per‑item percentage discount
  if (discountType === 'percent' || discountType === 'percentage') {
    if (couponVal > 0) {
      const amount = gross * (1 - couponVal / 100);
      return { discountPercent: couponVal, amount };
    }
  }

  // Per‑item fixed discount (price)
  if (discountType === 'price' || discountType === 'fixed') {
    if (couponVal > 0) {
      const amount = Math.max(0, gross - couponVal);
      return { discountAmount: couponVal, amount };
    }
  }

  // No per‑item discount
  return { amount: gross };
}

export function mapCheckoutOrderInvoiceResponseToInvoiceData(
  order: CheckoutOrderInvoiceApiPayload,
): InvoiceData {
  const globalCouponDiscount = toNum(order.coupon_discount);
  const globalDiscountType = order.discount_type?.toLowerCase();

  // Pre‑compute eligible subtotal for proportion calculations
  let eligibleSubtotal = 0;
  const itemEligibility = order.items.map((row) => {
    const eligible = isItemEligibleForCoupon(row);
    if (eligible) {
      const qty = Math.max(0, Number(row.quantity) || 0);
      const unitPrice = toNum(row.unit_price); // use original unit price
      eligibleSubtotal += unitPrice * qty;
    }
    return eligible;
  });

  // Build items with discount information
  const finalItems: InvoiceItem[] = order.items.map((row, idx) => {
    const qty = Math.max(0, Number(row.quantity) || 0);
    const unitPrice = toNum(row.offer_price ?? row.unit_price);
    const originalUnitPrice = toNum(row.unit_price);
    const isEligible = itemEligibility[idx];

    // First try per‑item discount fields
    const perItemDiscount = computeItemDiscount(row);
    if (perItemDiscount.discountPercent !== undefined || perItemDiscount.discountAmount !== undefined) {
      return {
        id: row.id,
        item: row.item_name?.trim() || `Item ${row.id}`,
        discountPercent: perItemDiscount.discountPercent,
        discountAmount: perItemDiscount.discountAmount,
        quantity: qty,
        price: unitPrice,
        type: mapLineItemType(row.item_type),
        amount: perItemDiscount.amount,
      };
    }

    // No per‑item discount – use global coupon logic if applicable
    let discountPercent: number | undefined;
    let discountAmount: number | undefined;
    let amount = originalUnitPrice * qty;

    if (globalCouponDiscount > 0 && globalDiscountType && isEligible && eligibleSubtotal > 0) {
      const itemSubtotal = originalUnitPrice * qty;
      let effectivePercent = 0;

      if (globalDiscountType === 'percentage') {
        // Global percentage coupon: globalCouponDiscount is the percentage rate (e.g., 20)
        discountPercent = globalCouponDiscount;
        effectivePercent = globalCouponDiscount;
      } else if (globalDiscountType === 'price' || globalDiscountType === 'fixed') {
        // Fixed amount coupon: compute common percentage from total discount / eligible subtotal
        effectivePercent = (globalCouponDiscount / eligibleSubtotal) * 100;
        discountPercent = effectivePercent;
      }

      // Calculate discounted amount using the common percentage
      if (effectivePercent > 0) {
        const discountMultiplier = effectivePercent / 100;
        const discountOnItem = itemSubtotal * discountMultiplier;
        const netUnitPrice = originalUnitPrice * (1 - discountMultiplier);
        amount = netUnitPrice * qty;
        // Store discountAmount as the money saved (optional, but keeping for completeness)
        discountAmount = discountOnItem;
      }
    }

    // If the computed discount is zero or not applicable, leave fields empty
    if (discountPercent !== undefined && discountPercent <= 0) {
      discountPercent = undefined;
      discountAmount = undefined;
    }

    return {
      id: row.id,
      item: row.item_name?.trim() || `Item ${row.id}`,
      discountPercent,
      discountAmount: discountAmount && discountAmount > 0 ? discountAmount : undefined,
      quantity: qty,
      price: unitPrice,
      type: mapLineItemType(row.item_type),
      amount: amount > 0 ? amount : originalUnitPrice * qty,
    };
  });

  const billedName = order.user?.name?.trim() || 'Customer';
  const billing = order.billing_address?.trim() || '';
  const shipping = order.shipping_address?.trim() || '';

  let noteParts = ['Thank you for choosing us.'];
  if (order.applied_coupon_code?.trim()) {
    noteParts = [`Coupon: ${order.applied_coupon_code.trim()}`, ...noteParts];
  }

  const couponDiscount = toNum(order.coupon_discount);
  const subtotalRaw = toNum(order.subtotal);
  const subAfter = toNum(order.subtotal_after_coupon ?? order.subtotal);
  const inferredCoupon =
    couponDiscount > 0 ? couponDiscount : Math.max(0, subtotalRaw - subAfter);

  return {
    invoiceNumber: order.invoice_number,
    date: order.created_at ? formatInvoiceDate(order.created_at) : '',
    billedTo: {
      name: billedName,
      addressLine1: billing || shipping,
      addressLine2:
        billing && shipping && billing !== shipping ? shipping : undefined,
      email: order.user?.email?.trim() || undefined,
      phone: order.user?.phone?.trim() || undefined,
    },
from: {
  name: 'VIKING TIN TOBACCO & CIGARETTES TRADING L.L.C',
  addressLine1: 'UAE, Dubai, Al Murar',
  addressLine2: 'Tax Registration Number: 105280250900001',
  email: 'info@vikingtin.ae',
  phone: '+971 50 099 9381',
},
    paymentMethod: order.payment_method?.replace(/_/g, ' ') || '—',
    note: noteParts.join(' '),
    currencySymbol: '$',
    items: finalItems,
    summary: {
      subtotal: subtotalRaw,
      taxes: toNum(order.tax),
      discount: inferredCoupon,
      deliveryCharge: toNum(order.delivery_fee ?? order.shipping_cost),
      total: toNum(order.total),
    },
  };
}