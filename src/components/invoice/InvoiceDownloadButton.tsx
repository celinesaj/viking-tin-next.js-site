'use client';

import { pdf } from '@react-pdf/renderer';
import { InvoicePdfDocument } from './InvoicePdfDocument';
import type { InvoiceData } from '@/types/invoice';

type Props = {
  invoice: InvoiceData;
  invoiceNumber: string;
};

export default function InvoiceDownloadButton({ invoice, invoiceNumber }: Props) {
  const handleDownload = async () => {
    try {
      // Generate PDF blob using react-pdf's pdf() function
      const blob = await pdf(<InvoicePdfDocument invoice={invoice} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
    >
      Download PDF
    </button>
  );
}