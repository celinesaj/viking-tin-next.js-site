// components/PaymentResultGuard.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentResultGuard({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const storedOrderId = sessionStorage.getItem('pendingPaymentOrderId');

    if (storedOrderId && storedOrderId === orderIdFromUrl) {
      // Valid one-time access – consume the token immediately
      sessionStorage.removeItem('pendingPaymentOrderId');
      setAllowed(true);
    } else {
      // Not allowed – redirect away
      router.replace('/');
    }
  }, [orderIdFromUrl, router]);

  if (!allowed) return null; // Show nothing while redirecting

  return <>{children}</>;
}