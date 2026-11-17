import { NextRequest, NextResponse } from 'next/server';
import {
  addLocalAddress,
  listLocalAddresses,
  readAccessToken,
  unauthorized,
} from '@/lib/localSession';

export async function GET() {
  if (!(await readAccessToken())) return unauthorized();
  return NextResponse.json(listLocalAddresses());
}

export async function POST(request: NextRequest) {
  if (!(await readAccessToken())) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid address.' }, { status: 400 });
  }
  const input = body as {
    zone_id?: string;
    title?: string;
    address_line?: string;
    street?: string;
    more_info?: string;
    is_default?: boolean;
  };
  const row = addLocalAddress({
    zone_id: input.zone_id || 'local-zone',
    title: input.title || 'Home',
    address_line: input.address_line || '',
    street: input.street || '',
    more_info: input.more_info,
    is_default: input.is_default,
  });
  return NextResponse.json(row);
}
