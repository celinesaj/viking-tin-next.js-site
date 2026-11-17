import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { attachSessionCookies, makeLocalJwt, readJwt } from '@/lib/localSession';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const payload = refreshToken ? readJwt(refreshToken) : null;

  if (!refreshToken || payload?.tokenType !== 'refresh') {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: 'Session refreshed locally.',
  });

  return attachSessionCookies(
    response,
    makeLocalJwt('access', 60 * 60),
    makeLocalJwt('refresh', 60 * 60 * 24 * 30),
  );
}
