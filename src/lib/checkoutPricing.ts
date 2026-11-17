// import type { CartItem } from '@/types/cart';
// import { calculateCartSummary } from '@/lib/cartPricing';

// export function calculateCheckoutSummary(
//   items: CartItem[],
//   deliveryFee = 0,
//   taxRatePercent = 0
// ) {
//   const cartSummary = calculateCartSummary(items, taxRatePercent);
//   const total = Number((cartSummary.total + deliveryFee).toFixed(2));

//   return {
//     ...cartSummary,
//     deliveryFee: Number(deliveryFee.toFixed(2)),
//     total,
//   };
// }