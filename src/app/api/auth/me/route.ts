import { NextRequest, NextResponse } from 'next/server';
import { LOCAL_USER, readAccessToken, unauthorized } from '@/lib/localSession';

export async function GET() {
  const accessToken = await readAccessToken();
  if (!accessToken) return unauthorized();

  return NextResponse.json({
    success: true,
    user: LOCAL_USER,
  });
}

export async function PATCH(request: NextRequest) {
  const accessToken = await readAccessToken();
  if (!accessToken) return unauthorized();

  const formData = await request.formData().catch(() => null);
  const firstName = formData?.get('first_name');
  const lastName = formData?.get('last_name');
  const email = formData?.get('email');

  const user = {
    ...LOCAL_USER,
    first_name: typeof firstName === 'string' && firstName ? firstName : LOCAL_USER.first_name,
    last_name: typeof lastName === 'string' && lastName ? lastName : LOCAL_USER.last_name,
    email: typeof email === 'string' && email ? email : LOCAL_USER.email,
    name: `${typeof firstName === 'string' && firstName ? firstName : LOCAL_USER.first_name} ${
      typeof lastName === 'string' && lastName ? lastName : LOCAL_USER.last_name
    }`.trim(),
  };

  return NextResponse.json({
    success: true,
    message: 'Profile updated locally.',
    user,
  });
}
