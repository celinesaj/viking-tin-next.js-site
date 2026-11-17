'use client';

import { useRef } from 'react';
import type { InvoiceData } from '@/types/invoice';
import InvoiceDocument from './InvoiceDocument';    // your HTML view component
import InvoiceDownloadButton from './InvoiceDownloadButton';

type Props = {
  orderId: string;
  invoice: InvoiceData;   // ensure this is always defined
};

export default function InvoiceView({ orderId, invoice }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // If invoice is missing, show an error or loading state
  if (!invoice) {
    return <div>Invoice data is missing</div>;
  }

  return (
    <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto mb-5 flex w-full max-w-[1100px] items-center justify-end">
        <InvoiceDownloadButton
          invoiceNumber={invoice.invoiceNumber}
          invoice={invoice}   // ✅ pass the full invoice object
        />
      </div>

      <InvoiceDocument invoice={invoice} invoiceRef={invoiceRef} />
    </section>
  );
}