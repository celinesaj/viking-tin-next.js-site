'use client';

import type { CartItem } from '@/types/cart';
import { formatPrice } from '@/lib/PriceFormat';
import { calculateCheckoutSummary } from '@/lib/calculateCheckoutSummary';

type Props = {
  items?: CartItem[];
  deliveryFee?: number;
  taxRatePercent?: number;
  discountAmount?: number;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  disabled?: boolean;
};

export default function CheckoutSummary({
  items = [],
  deliveryFee = 0,
  taxRatePercent = 0,
  discountAmount = 0,
  isSubmitting = false,
  onSubmit,
  disabled = false,
}: Props) {
  const summary = calculateCheckoutSummary(
    items,
    deliveryFee,
    taxRatePercent,
    discountAmount
  );

  const isDisabled = disabled || items.length === 0 || isSubmitting;

  return (
    <aside className="mt-6 rounded-[28px] border border-black/10 p-5 md:p-6">
      <h3 className="text-[20px] font-semibold text-black md:text-[24px]">
        Order Summary
      </h3>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Subtotal" value={formatPrice(summary.subtotal)} />
        <SummaryRow label="Discount" value={formatPrice(summary.discount)} />
        <SummaryRow label="Delivery" value={formatPrice(summary.deliveryFee)} />
        <SummaryRow label="Tax" value={formatPrice(summary.tax)} />

        <div className="border-t border-black/10 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[18px] font-semibold text-black md:text-[20px]">
              Total
            </span>
            <span className="text-[18px] font-semibold text-black md:text-[20px]">
              {formatPrice(summary.total)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isDisabled}
        className={`mt-6 hidden h-[56px] w-full items-center justify-center rounded-full text-[16px] font-medium lg:inline-flex ${
          isDisabled
            ? 'cursor-not-allowed bg-black/30 text-white'
            : 'bg-black text-white transition hover:border hover:border-black hover:bg-white hover:text-black'
        }`}
      >
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </button>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[15px] text-black/55 md:text-[16px]">{label}</span>
      <span className="text-[15px] font-medium text-black md:text-[16px]">
        {value}
      </span>
    </div>
  );
}