import { NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function POST() {
  if (!(await readAccessToken())) return unauthorized();
  return NextResponse.json({
    success: true,
    message: 'Phone marked as verified locally.',
  });
}
