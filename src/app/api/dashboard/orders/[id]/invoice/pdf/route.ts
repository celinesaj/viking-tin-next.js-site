import { NextResponse } from 'next/server';
import { localInvoicePdf } from '@/lib/localSession';

export async function GET() {
  return new NextResponse(localInvoicePdf(), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="local-invoice.pdf"',
    },
  });
}
