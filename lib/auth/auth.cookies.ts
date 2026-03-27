import "server-only";

import { cookies } from "next/headers";

import type { AuthTokens, SessionData } from "@/lib/auth/auth.types";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createSessionCookieOptions,
} from "@/lib/auth/auth.constants";
import { decodeSessionCookie, encodeSessionCookie } from "@/lib/auth/auth.session-cookie";

export function isCookieMutationError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Cookies can only be modified");
}

export async function readAuthTokens(): Promise<AuthTokens | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export async function readSessionData(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return null;
  }

  return decodeSessionCookie(sessionValue);
}

export async function writeSessionCookies(
  tokens: AuthTokens,
  session: SessionData
): Promise<void> {
  const cookieStore = await cookies();
  const options = createSessionCookieOptions();

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, options);
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, options);
  cookieStore.set(SESSION_COOKIE_NAME, encodeSessionCookie(session), options);
}

export async function writeSessionCookiesSafely(
  tokens: AuthTokens,
  session: SessionData
): Promise<void> {
  try {
    await writeSessionCookies(tokens, session);
  } catch (error: unknown) {
    if (!isCookieMutationError(error)) {
      throw error;
    }
  }
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function clearSessionCookiesSafely(): Promise<void> {
  try {
    await clearSessionCookies();
  } catch (error: unknown) {
    if (!isCookieMutationError(error)) {
      throw error;
    }
  }
}
