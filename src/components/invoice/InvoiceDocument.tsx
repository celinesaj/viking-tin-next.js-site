'use client';

import type { RefObject } from 'react';
import type { InvoiceData } from '@/types/invoice';
import { InvoiceDocumentCore } from '@/components/invoice/InvoiceDocumentCore';

type Props = {
  invoice: InvoiceData;
  invoiceRef?: RefObject<HTMLDivElement | null>;
};

export default function InvoiceDocument({ invoice, invoiceRef }: Props) {
  return <InvoiceDocumentCore ref={invoiceRef} invoice={invoice} />;
}
