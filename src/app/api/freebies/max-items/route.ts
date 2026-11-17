import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ max_free_items: 0, is_active: false });
}
