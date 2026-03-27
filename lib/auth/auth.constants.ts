import { env } from "@/lib/config/env";

export const ACCESS_TOKEN_COOKIE_NAME = "scholaris.access-token";
export const REFRESH_TOKEN_COOKIE_NAME = "scholaris.refresh-token";
export const SESSION_COOKIE_NAME = "scholaris.session";
export const COOKIE_MAX_AGE_IN_SECONDS = 60 * 60 * 24 * 7;

export function createSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.cookieSecure,
    path: "/",
    maxAge: COOKIE_MAX_AGE_IN_SECONDS,
  };
}
