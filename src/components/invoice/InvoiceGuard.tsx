// components/orders/InvoiceGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetOrderInvoiceQuery } from '@/features/orders/ordersApi';

function canViewInvoice(order: any) {
  return (
    (order.payment_method === 'cash_on_delivery' && order.status === 'delivered') ||
     (order.payment_method === 'cod' && order.status === 'delivered') ||
    (order.payment_method !== 'cash_on_delivery' && order.status === 'paid')
  );
}

export default function InvoiceGuard({
  orderId,
  children,
}: {
  orderId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: order, isLoading, isError } = useGetOrderInvoiceQuery(orderId, {
    skip: !orderId,
  });

  useEffect(() => {
    if (isLoading) return;

    // No order or fetch failed → go back to order detail
    if (isError || !order) {
      router.replace(`/account/order-history/${orderId}`);
      return;
    }

    // Conditions not met → go back to order detail
    if (!canViewInvoice(order)) {
      router.replace(`/account/order-history/${orderId}`);
    }
  }, [order, isLoading, isError, orderId, router]);

  // Show nothing while checking — avoids flash of invoice content
  if (isLoading || !order || !canViewInvoice(order)) {
    return <div className="h-[300px] animate-pulse rounded-xl bg-black/5" />;
  }

  return <>{children}</>;
}