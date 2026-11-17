import { NextResponse } from 'next/server';
import { readAccessToken, unauthorized } from '@/lib/localSession';

export async function POST() {
  if (!(await readAccessToken())) return unauthorized('not authorized');
  return NextResponse.json({
    success: true,
    message: 'Freebie claim stored locally.',
  });
}
