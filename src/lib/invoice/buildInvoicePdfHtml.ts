import type { InvoiceData } from '@/types/invoice';

export function buildInvoicePdfHtml(invoice: InvoiceData, assetOrigin: string): string {
  // Return a serialized payload that htmlToPdfBuffer will parse
  return JSON.stringify({ invoice, assetOrigin });
}