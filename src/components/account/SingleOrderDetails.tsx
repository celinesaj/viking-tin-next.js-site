'use client';

import Link from 'next/link';
import { useGetOrderInvoiceQuery } from '@/features/orders/ordersApi';
import { formatPrice } from '@/lib/PriceFormat';

type Props = {
    orderId: string;
};

type OrderItemWithDisplay = {
    item_name?: string | null;
    item_image_url?: string | null;
};

type OrderWithDisplay = {
    coupon_discount?: string | null;
    applied_coupon_code?: string | null;
};

function toNumber(value: string | number | null | undefined) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function SingleOrderDetails({ orderId }: Props) {
    const { data: order, isLoading, isFetching, isError } =
        useGetOrderInvoiceQuery(orderId, { skip: !orderId });

        

    if (isLoading || isFetching) {
        return <div className="h-[300px] animate-pulse rounded-xl bg-black/5" />;
    }

    if (isError || !order) {
        return (
            <div className="max-w-[900px]">
                <p className="mt-10 text-sm text-red-500">Failed to load order.</p>
                <Link
                    href="/account/order-history"
                    className="mt-6 inline-flex h-[42px] items-center justify-center rounded-full border border-black px-5 text-xs font-medium uppercase text-black hover:bg-black hover:text-white"
                >
                    Back to Orders
                </Link>
            </div>
        );
    }

    const orderDisplay = order as typeof order & OrderWithDisplay;
    const couponDiscount = toNumber(orderDisplay.coupon_discount);
    const delivery = toNumber(order.shipping_cost || order.delivery_fee);

    const canViewInvoice =
  (order.payment_method === 'cash_on_delivery' && order.status === 'delivered') ||
  (order.payment_method !== 'cash_on_delivery' && order.status === 'paid')  ||
  (order.payment_method === 'cod' && order.status === 'delivered');

    return (
        <div className="w-full max-w-[920px]">
            {/* Breadcrumb */}
            <p className="text-xs text-black/50">
                Home <span className="mx-1">{'>'}</span>
                Orders <span className="mx-1">{'>'}</span>
                <span className="font-medium text-black">{order.order_number}</span>
            </p>

            <section className="mt-6 rounded-[20px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-7">
                {/* Header */}
                <div className="border-b border-black/10 pb-5">
                    <p className="text-[11px] uppercase tracking-wide text-black/40">
                        Order
                    </p>

                    <h1 className="mt-2 text-[22px] font-semibold text-black sm:text-[26px]">
                        Order{' '}
                        <span className="font-semibold text-black">
                            {order.order_number}
                        </span>
                    </h1>

                    <p className="mt-2 text-sm text-black/50">
                        Placed on {formatDate(order.created_at)}
                    </p>

                    <div className="mt-4 flex gap-2">
                        <span className="rounded-full bg-black px-3 py-1 text-[11px] text-white">
                            {order.status}
                        </span>

                        <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] text-black/60">
                            {order.payment_method.replaceAll('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* Address */}
                <div className="mt-5">
                    <InfoBox title="Shipping Address" value={order.shipping_address} />
                </div>

                {/* Summary */}
                <div className="mt-5 rounded-[16px] border border-black/10 p-4">
                    <p className="mb-3 text-sm font-medium text-black">Summary</p>

                    <div className="space-y-2 text-sm">
                        <Row label="Subtotal" value={formatPrice(toNumber(order.subtotal))} />

                        {couponDiscount > 0 && (
                            <Row
                                label="Discount"
                                value={`-${formatPrice(couponDiscount)}`}
                            />
                        )}

                        <Row label="Delivery" value={formatPrice(delivery)} />
                        <Row label="Tax" value={formatPrice(toNumber(order.tax))} />

                        <div className="mt-3 flex justify-between border-t pt-3 text-[15px] font-medium">
                            <span>Total</span>
                            <span>{formatPrice(toNumber(order.total))}</span>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="mt-5 rounded-[16px] border border-black/10 p-4">
                    <p className="mb-3 text-sm font-medium text-black">
                        Items ({order.items.length})
                    </p>

                    <div className="space-y-3">
                        {order.items.map((rawItem) => {
                            const item = rawItem as typeof rawItem & OrderItemWithDisplay;

                            const quantity = toNumber(item.quantity);
                            const unitPrice = toNumber(item.unit_price);
                            const total = quantity * unitPrice;

                            const name =
                                item.item_name ||
                                `${item.item_type} #${item.item_id}`;

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-[14px] bg-black/[0.03] p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.item_image_url ? (
                                            <img
                                                src={item.item_image_url}
                                                className="h-12 w-12 rounded-[10px] object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-[10px] bg-black/5" />
                                        )}

                                        <div>
                                            <p className="text-sm font-medium text-black">
                                                {name}
                                            </p>

                                            <p className="text-xs text-black/50">
                                                #{item.item_id}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right text-sm">
                                        <p className="text-black/50">{quantity} ×</p>
                                        <p className="font-medium">{formatPrice(total)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/account/order-history"
                        className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-black px-6 text-[13px] font-medium uppercase text-black transition hover:bg-black hover:text-white sm:w-auto sm:min-w-[160px]"
                    >
                        Back to Orders
                    </Link>

                  {canViewInvoice && (
    <Link
      href={`/account/order-history/${orderId}/invoice`}
      className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-black px-6 text-[13px] font-medium uppercase text-white transition hover:bg-white hover:text-black hover:ring-1 hover:ring-black sm:w-auto sm:min-w-[160px]"
    >
      View Invoice
    </Link>
  )}
                </div>
            </section>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-black/70">
            <span>{label}</span>
            <span className="text-black">{value}</span>
        </div>
    );
}

function InfoBox({
    title,
    value,
}: {
    title: string;
    value?: string | null;
}) {
    return (
        <div className="rounded-[16px] bg-black/[0.03] p-4">
            <p className="text-[11px] uppercase text-black/40">{title}</p>
            <p className="mt-1 text-sm text-black">{value || '—'}</p>
        </div>
    );
}