import { NextRequest, NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function POST(request: NextRequest) {
  if (!(await readAccessToken())) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { success: false, message: 'Invalid checkout payload.' },
      { status: 400 },
    );
  }

  const payload = body as { total?: number; payment_method?: string; shipping_address?: string };
  return NextResponse.json({
    success: true,
    message: 'Order stored locally. No payment API was called.',
    order_id: 'local-order-1',
    order_number: 'VT-LOCAL-1',
    status: 'pending',
    total: payload.total ?? 0,
    payment_method: payload.payment_method ?? 'cash',
    shipping_address: payload.shipping_address ?? '',
  });
}
