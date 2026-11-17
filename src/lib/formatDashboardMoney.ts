const AED_FORMAT = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Dashboard amounts (orders, coupons, KPIs). Invalid numbers display as AED 0.00. */
export function formatDashboardMoney(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  const amount = Number.isNaN(n) ? 0 : n;
  return AED_FORMAT.format(amount);
}

/** Product / bundle / offer list prices: preserves raw string when not a finite number; empty → em dash. */
export function formatDashboardPrice(price: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price.trim() ? price : '—';
  return AED_FORMAT.format(n);
}
