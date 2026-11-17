import { NextRequest, NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET(request: NextRequest) {
  if (!(await readAccessToken())) return unauthorized();
  const code = new URL(request.url).searchParams.get('code')?.trim();
  if (!code) {
    return NextResponse.json(
      { valid: false, message: 'Coupon code is required.' },
      { status: 400 },
    );
  }
  return NextResponse.json({
    valid: false,
    message: 'Coupons are offline in this preview.',
  });
}
