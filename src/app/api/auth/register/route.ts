import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { success: false, message: 'Invalid registration payload.' },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Account created locally. No verification API was called.',
  });
}
