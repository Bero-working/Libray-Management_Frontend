import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createSessionCookieOptions,
} from "@/lib/auth/auth.constants";
import { shouldRefreshToken } from "@/lib/auth/auth.jwt";
import { requestTokenRefresh } from "@/lib/auth/auth.refresh";
import { decodeSessionCookie } from "@/lib/auth/auth.session-cookie";
import type { AuthTokens } from "@/lib/auth/auth.types";
import { APP_ROUTES, PROTECTED_ROUTE_PREFIXES } from "@/lib/config/routes";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function createForwardedResponse(request: NextRequest): NextResponse {
  return NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });
}

function clearRequestAuthCookies(request: NextRequest): void {
  request.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
  request.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
  request.cookies.delete(SESSION_COOKIE_NAME);
}

function clearResponseAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
  response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
  response.cookies.delete(SESSION_COOKIE_NAME);
}

function writeRequestAuthCookies(request: NextRequest, tokens: AuthTokens): void {
  request.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken);
}

function writeResponseAuthCookies(
  response: NextResponse,
  tokens: AuthTokens,
  sessionCookieValue: string
): void {
  const options = createSessionCookieOptions();

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, options);
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, options);
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookieValue, options);
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function invalidateSession(request: NextRequest, redirectToLogin: boolean): NextResponse {
  clearRequestAuthCookies(request);

  const response = redirectToLogin
    ? redirectTo(request, APP_ROUTES.login)
    : createForwardedResponse(request);

  clearResponseAuthCookies(response);

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPath = isProtectedPath(pathname);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const sessionCookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionData = sessionCookieValue ? decodeSessionCookie(sessionCookieValue) : null;
  const hasAnyAuthCookie = Boolean(accessToken || refreshToken || sessionCookieValue);

  if (!accessToken || !refreshToken || !sessionCookieValue || !sessionData) {
    if (hasAnyAuthCookie) {
      return invalidateSession(request, protectedPath);
    }

    if (pathname === APP_ROUTES.login || !protectedPath) {
      return createForwardedResponse(request);
    }

    return redirectTo(request, APP_ROUTES.login);
  }

  if (shouldRefreshToken(accessToken)) {
    try {
      const refreshedTokens = await requestTokenRefresh(refreshToken);

      writeRequestAuthCookies(request, refreshedTokens);

      if (pathname === APP_ROUTES.login) {
        const response = redirectTo(request, APP_ROUTES.home);
        writeResponseAuthCookies(response, refreshedTokens, sessionCookieValue);
        return response;
      }

      const response = createForwardedResponse(request);
      writeResponseAuthCookies(response, refreshedTokens, sessionCookieValue);
      return response;
    } catch {
      return invalidateSession(request, protectedPath);
    }
  }

  if (pathname === APP_ROUTES.login) {
    return redirectTo(request, APP_ROUTES.home);
  }

  return createForwardedResponse(request);
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/librarian/:path*", "/leader/:path*"],
};
