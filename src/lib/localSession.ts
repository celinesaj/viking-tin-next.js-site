import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const LOCAL_USER = {
  id: 'local-user',
  first_name: 'Local',
  last_name: 'Preview',
  name: 'Local Preview',
  email: 'preview@vikingtin.local',
  phone: '+971500000000',
  phone_verified_at: '2026-01-15T00:00:00.000Z',
  code_expires_at: null,
  age_verified_at: '2026-01-15T00:00:00.000Z',
  address: 'Dubai, UAE',
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
};

export function makeLocalJwt(tokenType: 'access' | 'refresh', ttlSeconds: number) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = Buffer.from(
    JSON.stringify({ tokenType, exp, sub: LOCAL_USER.id }),
  ).toString('base64url');
  return `${header}.${payload}.local`;
}

export function readJwt(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

export function attachSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  const accessPayload = readJwt(accessToken);
  const refreshPayload = readJwt(refreshToken);
  const accessExp = typeof accessPayload?.exp === 'number' ? accessPayload.exp : null;
  const refreshExp = typeof refreshPayload?.exp === 'number' ? refreshPayload.exp : null;

  response.cookies.set({
    name: 'access_token',
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(accessExp ? { expires: new Date(accessExp * 1000) } : { maxAge: 60 * 15 }),
  });

  response.cookies.set({
    name: 'refresh_token',
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    ...(refreshExp
      ? { expires: new Date(refreshExp * 1000) }
      : { maxAge: 60 * 60 * 24 * 30 }),
  });

  return response;
}

export async function readAccessToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;
  const payload = readJwt(token);
  if (payload?.tokenType !== 'access') return null;
  if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) return null;
  return token;
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

type LocalAddress = {
  id: string;
  user_id: string;
  zone_id: string;
  zone: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    is_active: boolean;
  };
  title: string;
  address_line: string;
  street: string;
  more_info: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const addresses: LocalAddress[] = [];

export function listLocalAddresses() {
  return addresses;
}

export function addLocalAddress(input: {
  zone_id: string;
  title: string;
  address_line: string;
  street: string;
  more_info?: string;
  is_default?: boolean;
}) {
  const now = new Date().toISOString();
  const row: LocalAddress = {
    id: `addr-${addresses.length + 1}`,
    user_id: LOCAL_USER.id,
    zone_id: input.zone_id,
    zone: {
      id: input.zone_id,
      name: 'Local zone',
      price: 0,
      description: null,
      is_active: true,
    },
    title: input.title,
    address_line: input.address_line,
    street: input.street,
    more_info: input.more_info ?? null,
    is_default: Boolean(input.is_default),
    created_at: now,
    updated_at: now,
  };
  if (row.is_default) {
    for (const address of addresses) address.is_default = false;
  }
  addresses.push(row);
  return row;
}

export function updateLocalAddress(
  id: string,
  input: Partial<Omit<LocalAddress, 'id' | 'user_id' | 'zone' | 'created_at'>>,
) {
  const row = addresses.find((address) => address.id === id);
  if (!row) return null;
  if (input.is_default) {
    for (const address of addresses) address.is_default = false;
  }
  Object.assign(row, input, { updated_at: new Date().toISOString() });
  if (input.zone_id) {
    row.zone = { ...row.zone, id: input.zone_id };
  }
  return row;
}

export function deleteLocalAddress(id: string) {
  const index = addresses.findIndex((address) => address.id === id);
  if (index < 0) return false;
  addresses.splice(index, 1);
  return true;
}

export function localInvoicePdf() {
  const text = 'Local preview invoice. No payment API was called.';
  const stream = `BT /F1 18 Tf 72 120 Td (${text}) Tj ET`;
  return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${stream.length}>>stream
${stream}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
}
