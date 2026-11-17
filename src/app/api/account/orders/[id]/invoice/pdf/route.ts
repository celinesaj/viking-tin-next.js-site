import { NextResponse } from 'next/server';
import { localInvoicePdf, readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET() {
  if (!(await readAccessToken())) return unauthorized();
  return new NextResponse(localInvoicePdf(), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="local-invoice.pdf"',
    },
  });
}
