import { pdf } from '@react-pdf/renderer';
import InvoicePdfServer from '@/components/invoice/InvoicePdfServer';
import type { InvoiceData } from '@/types/invoice';
import { Buffer } from 'buffer';

export async function htmlToPdfBuffer(
  serializedPayload: string
): Promise<Buffer> {
  const { invoice, assetOrigin } = JSON.parse(serializedPayload) as {
    invoice: InvoiceData;
    assetOrigin: string;
  };

  const logoUrl = `${assetOrigin.replace(/\/$/, '')}/images/logo/logo.png`;

  const stream = await pdf(
    <InvoicePdfServer invoice={invoice} logoUrl={logoUrl} />
  ).toBuffer();

  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
}