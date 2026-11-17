import { NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET() {
  if (!(await readAccessToken())) return unauthorized();
  return NextResponse.json([]);
}
