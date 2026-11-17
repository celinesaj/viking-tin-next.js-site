import InvoiceGuard from '@/components/invoice/InvoiceGuard';
import InvoicePageClient from '@/components/invoice/InvoicePageClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderInvoicePage({ params }: Props) {
  const { id } = await params;

  return (
    <InvoiceGuard orderId={id}>
      <InvoicePageClient orderId={id} />
    </InvoiceGuard>
  );
}