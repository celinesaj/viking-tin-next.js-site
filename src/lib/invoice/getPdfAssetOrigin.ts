export function getPdfAssetOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '').trim();
  if (fromEnv) return fromEnv;

  const host = request.headers.get('host');
  const forwarded = request.headers.get('x-forwarded-proto');
  const proto = forwarded ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');

  if (host) return `${proto}://${host}`;

  return 'http://localhost:3000';
}