import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { APP_ROUTES, PROTECTED_ROUTE_PREFIXES } from "@/lib/config/routes";

function hasSession(request: NextRequest): boolean {
  return (
    request.cookies.has("scholaris.session") &&
    request.cookies.has("scholaris.access-token") &&
    request.cookies.has("scholaris.refresh-token")
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = hasSession(request);

  if (pathname === APP_ROUTES.login && authenticated) {
    return NextResponse.redirect(new URL(APP_ROUTES.home, request.url));
  }

  if (isProtectedPath(pathname) && !authenticated) {
    return NextResponse.redirect(new URL(APP_ROUTES.login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/librarian/:path*", "/leader/:path*"],
};
