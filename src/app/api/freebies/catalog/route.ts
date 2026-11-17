import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ eligible: false, max_free_items: 0, products: [] });
}
