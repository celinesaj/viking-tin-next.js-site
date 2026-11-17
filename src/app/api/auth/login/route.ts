import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { LoginPayload } from '@/types/user';
import { LOCAL_USER, attachSessionCookies, makeLocalJwt } from '@/lib/localSession';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const phone = body?.phone?.trim();
  const password = body?.password;

  if (!phone || !password) {
    return NextResponse.json(
      { success: false, message: 'Phone number and password are required.' },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged in with local preview data.',
    user: { ...LOCAL_USER, phone },
  });

  return attachSessionCookies(
    response,
    makeLocalJwt('access', 60 * 60),
    makeLocalJwt('refresh', 60 * 60 * 24 * 30),
  );
}
