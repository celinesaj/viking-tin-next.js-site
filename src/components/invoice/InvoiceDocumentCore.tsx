import { forwardRef, type ReactNode } from 'react';
import type { InvoiceData } from '@/types/invoice';
import { formatPrice } from '@/lib/PriceFormat';

// ----------------------------------------------------------------------
// Utility: transform order JSON to invoice items
// ----------------------------------------------------------------------

export type TransformedInvoiceItem = {
  id: string;
  item: string;            // product/bundle name
  discountPercent?: number; // percentage discount (e.g., 15)
  discountAmount?: number;  // fixed discount per item (currency)
  quantity: number;
  price: number;            // original unit price
  type: string;             // 'product' | 'bundle'
  amount: number;           // final total after discount (quantity * net unit price)
};

/**
 * Transforms an order object (as received from your API) into invoice items.
 * Distributes the global coupon discount proportionally across all items.
 */
export function transformOrderToInvoiceItems(order: any): TransformedInvoiceItem[] {
  const items = order.items || [];
  if (items.length === 0) return [];

  // Calculate total subtotal (original price * quantity)
  const totalSubtotal = items.reduce(
    (sum: number, item: any) => sum + (item.unit_price * item.quantity),
    0
  );

  // Total discount applied to the whole order (from coupon)
  const totalDiscount = parseFloat(order.coupon_discount || '0');
  const discountType = order.discount_type; // 'price' or 'percent'

  // No discount: return items with zero discount
  if (totalDiscount === 0 || !discountType) {
    return items.map((item: any) => ({
      id: item.id,
      item: item.item_name,
      discountPercent: 0,
      discountAmount: 0,
      quantity: item.quantity,
      price: item.unit_price,
      type: item.item_type,
      amount: item.unit_price * item.quantity,
    }));
  }

  // Distribute totalDiscount proportionally by item subtotal
  return items.map((item: any) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const itemDiscountShare = (itemSubtotal / totalSubtotal) * totalDiscount;
    const netUnitPrice = item.unit_price - (itemDiscountShare / item.quantity);
    const finalAmount = netUnitPrice * item.quantity;

    let discountPercent = 0;
    let discountAmount = 0;

    if (discountType === 'percent') {
      // Same percentage for every item
      discountPercent = (totalDiscount / totalSubtotal) * 100;
    } else {
      // Fixed discount: show the absolute dollar amount saved on this item
      discountAmount = itemDiscountShare;
    }

    return {
      id: item.id,
      item: item.item_name,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      quantity: item.quantity,
      price: item.unit_price,
      type: item.item_type,
      amount: finalAmount,
    };
  });
}

// ----------------------------------------------------------------------
// InvoiceDocumentCore component
// ----------------------------------------------------------------------

export type InvoiceDocumentCoreProps = {
  invoice: InvoiceData;
  coupon?: {
    code: string;
    discount: number;
    type: 'price' | 'percent';
  };
};

function getAlignClass(align: 'left' | 'center' | 'right') {
  if (align === 'left') return 'text-left';
  if (align === 'right') return 'text-right';
  return 'text-center';
}

export const InvoiceDocumentCore = forwardRef<HTMLDivElement, InvoiceDocumentCoreProps>(
  function InvoiceDocumentCore({ invoice, coupon }, ref) {
    return (
      <div className="w-full">
        <div
          ref={ref}
          data-invoice-pdf-root
          className="mx-auto w-full max-w-[1100px] rounded-[24px] bg-white px-5 py-6 text-black shadow-[0_14px_40px_rgba(0,0,0,0.06)] sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        >
          {/* Header - unchanged */}
          <div className="flex flex-col gap-5 border-b border-solid border-[#e5e7eb] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex h-[64px] w-[150px] items-center justify-start">
                <img
                  src="/images/logo/logo.png"
                  alt="Viking Tin"
                  width={150}
                  height={64}
                  className="max-h-[64px] w-auto max-w-[150px] object-contain object-left"
                />
              </div>
              <h1 className="mt-6 block text-[30px] font-semibold uppercase leading-[1.15] text-black sm:text-[42px] sm:leading-[1.12]">
                Invoice
              </h1>
              <p className="mt-4 block text-sm leading-normal text-black/50">
                Date:{' '}
                <span className="font-medium text-black">
                  {invoice.date?.trim() ? invoice.date : '—'}
                </span>
              </p>
            </div>
            <div className="rounded-[18px] border border-solid border-[#e5e7eb] px-4 py-3 text-left sm:text-right">
              <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">Invoice No.</p>
              <p className="mt-1 text-sm font-semibold text-black">{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Billed To / From - unchanged */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoBlock title="Billed To">
              <p className="font-medium text-black">{invoice.billedTo.name}</p>
              {invoice.billedTo.addressLine1 && <p>{invoice.billedTo.addressLine1}</p>}
              {invoice.billedTo.addressLine2 && <p>{invoice.billedTo.addressLine2}</p>}
              {invoice.billedTo.email && <p>{invoice.billedTo.email}</p>}
              {invoice.billedTo.phone && <p>{invoice.billedTo.phone}</p>}
            </InfoBlock>
            <InfoBlock title="From">
              <p className="font-medium text-black">{invoice.from.name}</p>
              {invoice.from.addressLine1 && <p>{invoice.from.addressLine1}</p>}
              {invoice.from.addressLine2 && <p>{invoice.from.addressLine2}</p>}
              {invoice.from.email && <p>{invoice.from.email}</p>}
              {invoice.from.phone && <p>{invoice.from.phone}</p>}
            </InfoBlock>
          </div>

          {/* Items Table */}
          <div className="mt-6 overflow-hidden rounded-[18px] border border-solid border-[#e5e7eb]">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[720px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#f3f4f6]">
                    <TableHead align="left">Item</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead align="right">Amount</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((row: any, rowIndex: number) => (
                    <tr key={row.id}>
                      <TableCell align="left" rowDivider={rowIndex > 0}>
                        <span className="font-medium text-black">{row.item}</span>
                      </TableCell>

                      {/* Discount cell: show percentage or fixed amount */}
                      <TableCell rowDivider={rowIndex > 0}>
                        {row.discountPercent !== undefined && row.discountPercent > 0
                          ? `${row.discountPercent}%`
                          : row.discountAmount !== undefined && row.discountAmount > 0
                          ? formatPrice(row.discountAmount)
                          : '—'}
                      </TableCell>

                      <TableCell rowDivider={rowIndex > 0}>{row.quantity}</TableCell>
                      <TableCell rowDivider={rowIndex > 0}>{formatPrice(row.price)}</TableCell>
                      <TableCell rowDivider={rowIndex > 0}>
                        <span className="capitalize">{row.type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell align="right" rowDivider={rowIndex > 0}>
                        <span className="font-medium text-black">{formatPrice(row.amount)}</span>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-[360px] rounded-[18px] bg-[#f9fafb] p-5">
              <SummaryRow label="Subtotal" value={formatPrice(invoice.summary.subtotal)} />

              {coupon && coupon.discount !== 0 && (
                <SummaryRow
                  label={`Coupon (${coupon.code}) - ${coupon.type === 'percent' ? `${coupon.discount}%` : 'fixed'}`}
                  value={`-${formatPrice(coupon.discount)}`}
                />
              )}

              <SummaryRow label="Taxes" value={formatPrice(invoice.summary.taxes)} />

              {invoice.summary.discount > 0 && !coupon && (
                <SummaryRow label="Discount" value={`-${formatPrice(invoice.summary.discount)}`} />
              )}

              <SummaryRow label="Delivery" value={formatPrice(invoice.summary.deliveryCharge)} />

              <div className="mt-4 flex items-center justify-between border-t border-solid border-[#e5e7eb] pt-4 text-[17px] font-semibold text-black">
                <span>Total</span>
                <span>{formatPrice(invoice.summary.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer: Payment method + Coupon note */}
          <div className="mt-6 border-t border-solid border-[#e5e7eb] pt-5">
            <p className="text-sm text-black/60">
              Payment Method:{' '}
              <span className="font-medium capitalize text-black">{invoice.paymentMethod}</span>
            </p>
            {coupon && (
              <p className="mt-2 text-sm text-black/60">
                Coupon Applied:{' '}
                <span className="font-medium text-black">
                  {coupon.code} ({coupon.type === 'price' ? `$${coupon.discount.toFixed(2)} off` : `${coupon.discount}% off`})
                </span>
              </p>
            )}
            {invoice.note && (
              <p className="mt-2 text-sm text-black/60">
                Note: <span className="font-medium text-black">{invoice.note}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// ----------------------------------------------------------------------
// Helper components
// ----------------------------------------------------------------------

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[18px] bg-[#f9fafb] p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">{title}</p>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-6 text-black/65">{children}</div>
    </div>
  );
}

function TableHead({
  children,
  align = 'center',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <th
      className={`${getAlignClass(
        align
      )} align-middle border-b border-solid border-[#e5e7eb] px-4 py-4 text-[11px] font-medium uppercase tracking-[0.08em] text-black/50`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = 'center',
  rowDivider = false,
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  rowDivider?: boolean;
}) {
  return (
    <td
      className={`${getAlignClass(align)} align-middle px-4 py-4 text-sm leading-normal text-black/65 ${
        rowDivider ? 'border-t border-solid border-[#e5e7eb]' : ''
      }`}
    >
      {children}
    </td>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm text-black/65">
      <span>{label}</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );
}