import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function decodeJwtExp(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isExpired(token: string, bufferMs = 30_000): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return true;
  return Date.now() >= exp * 1000 - bufferMs;
}

export async function ensureValidAuthSession() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  const hasValidAccess = !!accessToken && !isExpired(accessToken);
  const hasValidRefresh = !!refreshToken && !isExpired(refreshToken);

  if (!hasValidAccess && !hasValidRefresh) {
    redirect('/login');
  }

  return {
    id: 'local-user',
    first_name: 'Local',
    last_name: 'Preview',
    email: 'preview@vikingtin.local',
    phone: '+971500000000',
    phone_verified_at: '2026-01-15T00:00:00.000Z',
    accessToken: hasValidAccess ? accessToken : refreshToken,
  };
}