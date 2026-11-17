export type ProductPricingInput = {
  price: string | number | null | undefined;
  comparePrice?: string | number | null;
  offer_price?: string | number | null;
  offer_percentage?: string | number | null;
  offer_discount_amount?: string | number | null;
};

export type ProductPricingResolved = {
  basePrice: number;
  finalPrice: number;
  oldPrice: number | null;
  hasOffer: boolean;
  offerBadge: string | null;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function resolveProductPricing(
  input: ProductPricingInput
): ProductPricingResolved {
  const basePrice = toNumber(input.price) ?? 0;
  const comparePrice = toNumber(input.comparePrice);
  const offerPrice = toNumber(input.offer_price);
  const offerPercentage = toNumber(input.offer_percentage);
  const offerDiscountAmount = toNumber(input.offer_discount_amount);

  const hasValidComparePrice =
    comparePrice !== null && comparePrice > 0;

  const hasOffer =
    offerPrice !== null &&
    offerPrice >= 0 &&
    offerPrice < basePrice;

  let finalPrice = basePrice;
  let oldPrice: number | null = null;

  if (hasOffer) {
    finalPrice = offerPrice;
    oldPrice = hasValidComparePrice ? comparePrice : basePrice;
  } else if (hasValidComparePrice && comparePrice > basePrice) {
    finalPrice = basePrice;
    oldPrice = comparePrice;
  }

  let offerBadge: string | null = null;

  if (hasOffer) {
    if (offerPercentage !== null && offerPercentage > 0) {
      offerBadge = `-${Math.round(offerPercentage)}%`;
    } else if (offerDiscountAmount !== null && offerDiscountAmount > 0) {
      offerBadge = `SAVE ${offerDiscountAmount}`;
    } else {
      offerBadge = 'SALE';
    }
  }

  return {
    basePrice,
    finalPrice,
    oldPrice,
    hasOffer,
    offerBadge,
  };
}