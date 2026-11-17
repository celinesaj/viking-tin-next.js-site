import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PAGES = ['/login', '/create-account', '/verify-signup'];
const PROTECTED_PREFIXES = ['/account', '/checkout', '/orders'];

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

function isJwtExpired(token: string, bufferMs = 30_000): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return true;
  return Date.now() >= exp * 1000 - bufferMs;
}

function buildLoginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return loginUrl;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: 'access_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set({
    name: 'refresh_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  // Auth.js cookies
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

  response.headers.append(
    'Set-Cookie',
    'Host-authjs.csrf-token=; Path=/; Max-Age=0; Secure; SameSite=Lax'
  );

  return response;
}

function attachAccessCookie(response: NextResponse, accessToken: string) {
  const accessExp = decodeJwtExp(accessToken);
  response.cookies.set({
    name: 'access_token',
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(accessExp
      ? { expires: new Date(accessExp * 1000) }
      : { maxAge: 60 * 15 }),
  });
}

function attachRefreshCookie(response: NextResponse, refreshToken: string) {
  const refreshExp = decodeJwtExp(refreshToken);
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
}

async function tryRefresh(_refreshToken: string) {
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_PREFIXES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isAuthPage && !isProtectedRoute) {
    return NextResponse.next();
  }

  // Detect orphaned Auth.js session (OAuth started but sync never completed
  // or logout didn't fully clear — nuke it and treat user as logged out)
  const nextAuthSession =
    request.cookies.get('__Secure-authjs.session-token')?.value ??
    request.cookies.get('authjs.session-token')?.value;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (nextAuthSession && !accessToken && !refreshToken) {
    if (isProtectedRoute) {
      return clearAuthCookies(
        NextResponse.redirect(buildLoginRedirect(request, pathname))
      );
    }
    return clearAuthCookies(NextResponse.next());
  }

  const hasValidAccessToken = !!accessToken && !isJwtExpired(accessToken);
  const hasValidRefreshToken = !!refreshToken && !isJwtExpired(refreshToken);

  // --- Valid access token ---
  if (hasValidAccessToken) {
    const accessPayload = decodeJwtPayload(accessToken!);

    if (accessPayload?.tokenType !== 'access') {
      if (isProtectedRoute) {
        return clearAuthCookies(
          NextResponse.redirect(buildLoginRedirect(request, pathname))
        );
      }
      return clearAuthCookies(NextResponse.next());
    }

    if (isAuthPage) {
      return NextResponse.redirect(new URL('/account', request.url));
    }

    return NextResponse.next();
  }

  // --- Expired access token, try refresh ---
  if (hasValidRefreshToken && refreshToken) {
    const refreshPayload = decodeJwtPayload(refreshToken);

    if (refreshPayload?.tokenType !== 'refresh') {
      if (isProtectedRoute) {
        return clearAuthCookies(
          NextResponse.redirect(buildLoginRedirect(request, pathname))
        );
      }
      return clearAuthCookies(NextResponse.next());
    }

    try {
      await tryRefresh(refreshToken);

      if (isProtectedRoute) {
        return clearAuthCookies(
          NextResponse.redirect(buildLoginRedirect(request, pathname))
        );
      }
      return clearAuthCookies(NextResponse.next());
    } catch {
      if (isProtectedRoute) {
        return clearAuthCookies(
          NextResponse.redirect(buildLoginRedirect(request, pathname))
        );
      }
      return clearAuthCookies(NextResponse.next());
    }
  }

  // --- No valid tokens ---
  if (isProtectedRoute) {
    return NextResponse.redirect(buildLoginRedirect(request, pathname));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/create-account',
    '/verify-signup',
    '/account/:path*',
    '/checkout/:path*',
    '/orders/:path*',
  ],
};