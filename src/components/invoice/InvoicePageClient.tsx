'use client';

import Link from 'next/link';
import InvoiceView from '@/components/invoice/InvoiceView';
import { useGetOrderInvoiceQuery } from '@/features/orders/ordersApi';
import { mapCheckoutOrderInvoiceResponseToInvoiceData } from '@/lib/mapCheckoutOrderInvoiceResponseToInvoiceData';

type Props = {
  orderId: string;
};

export default function InvoicePageClient({ orderId }: Props) {
  const {
    data: order,
    isLoading,
    isFetching,
    isError,
  } = useGetOrderInvoiceQuery(orderId, {
    skip: !orderId,
  });

  if (isLoading || isFetching) {
    return (
      <section className="w-full px-4 py-8">
        <div className="mx-auto h-[520px] max-w-[1100px] animate-pulse rounded-[24px] bg-black/5" />
      </section>
    );
  }

  if (isError || !order) {
    return (
      <section className="w-full px-4 py-8">
        <div className="mx-auto max-w-[900px]">
          <p className="text-sm text-red-500">Failed to load invoice.</p>

          <Link
            href={`/account/order-history/${orderId}`}
            className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full border border-black px-6 text-[13px] font-medium uppercase text-black transition hover:bg-black hover:text-white"
          >
            Back to Order
          </Link>
        </div>
      </section>
    );
  }

  const invoice = mapCheckoutOrderInvoiceResponseToInvoiceData(order);

  return <InvoiceView orderId={orderId} invoice={invoice} />;
}