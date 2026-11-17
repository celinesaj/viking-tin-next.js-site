import { NextRequest, NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET(request: NextRequest) {
  if (!(await readAccessToken())) return unauthorized();
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1) || 1;
  const limit = Number(searchParams.get('limit') ?? 20) || 20;

  return NextResponse.json({
    data: [],
    pagination: { page, limit, total: 0, totalPages: 1 },
  });
}
