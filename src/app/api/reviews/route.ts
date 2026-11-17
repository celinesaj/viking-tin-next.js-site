import { NextRequest, NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function POST(request: NextRequest) {
  if (!(await readAccessToken())) return unauthorized('not authorized');
  const body = await request.json().catch(() => null);
  return NextResponse.json({
    success: true,
    message: 'Review saved locally.',
    review: body,
  });
}
