import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully.' },
      { status: 200 }
    );

    // Custom JWT cookies
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    // Auth.js __Secure- prefixed cookies
    response.cookies.set('__Secure-authjs.session-token', '', {
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('__Secure-authjs.callback-url', '', {
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // Auth.js dev cookies (no prefix)
    response.cookies.set('authjs.session-token', '', {
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('authjs.callback-url', '', {
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('authjs.csrf-token', '', {
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // Host- prefixed cookie — must use raw Set-Cookie header
    response.headers.append(
      'Set-Cookie',
      'Host-authjs.csrf-token=; Path=/; Max-Age=0; Secure; SameSite=Lax'
    );

    return response;
  } catch (error) {
    console.error('[/api/auth/logout] Error:', error);

    const response = NextResponse.json(
      { success: false, message: 'An error occurred during logout.' },
      { status: 500 }
    );

    response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('__Secure-authjs.session-token', '', { path: '/', maxAge: 0, secure: true });
    response.cookies.set('authjs.session-token', '', { path: '/', maxAge: 0 });
    response.headers.append(
      'Set-Cookie',
      'Host-authjs.csrf-token=; Path=/; Max-Age=0; Secure; SameSite=Lax'
    );

    return response;
  }
}