import { NextResponse } from 'next/server';
import { LOCAL_USER, readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET() {
  if (!(await readAccessToken())) return unauthorized();
  return NextResponse.json({
    success: true,
    user: LOCAL_USER,
  });
}
