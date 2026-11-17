import { NextRequest, NextResponse } from 'next/server';
import {
  deleteLocalAddress,
  readAccessToken,
  unauthorized,
  updateLocalAddress,
} from '@/lib/localSession';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await readAccessToken())) return unauthorized();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const row = updateLocalAddress(id, body && typeof body === 'object' ? body : {});
  if (!row) {
    return NextResponse.json({ message: 'Address not found.' }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await readAccessToken())) return unauthorized();
  const { id } = await context.params;
  if (!deleteLocalAddress(id)) {
    return NextResponse.json({ message: 'Address not found.' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Address removed locally.' });
}
