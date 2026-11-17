import { NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET() {
  if (!(await readAccessToken())) return unauthorized();
  return NextResponse.json(
    { success: false, message: 'No local invoice for this order.' },
    { status: 404 },
  );
}
