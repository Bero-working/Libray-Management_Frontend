"use server";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { AuthTokens, SessionData } from "@/lib/auth/auth.types";
import { env } from "@/lib/config/env";

const accessTokenCookieName = "scholaris.access-token";
const refreshTokenCookieName = "scholaris.refresh-token";
const sessionCookieName = "scholaris.session";
const cookieMaxAgeInSeconds = 60 * 60 * 24 * 7;

function createCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.cookieSecure,
    path: "/",
    maxAge: cookieMaxAgeInSeconds,
  };
}

function signSessionValue(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("hex");
}

function encodeSession(session: SessionData): string {
  const payload = JSON.stringify(session);
  const signature = signSessionValue(payload);
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");

  return `${encodedPayload}.${signature}`;
}

function decodeSession(value: string): SessionData | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expectedSignature = signSessionValue(payload);
  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (provided.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    return JSON.parse(payload) as SessionData;
  } catch {
    return null;
  }
}

export async function readAuthTokens(): Promise<AuthTokens | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessTokenCookieName)?.value;
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value;

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
  const sessionValue = cookieStore.get(sessionCookieName)?.value;

  if (!sessionValue) {
    return null;
  }

  return decodeSession(sessionValue);
}

export async function writeSessionCookies(
  tokens: AuthTokens,
  session: SessionData
): Promise<void> {
  const cookieStore = await cookies();
  const options = createCookieOptions();

  cookieStore.set(accessTokenCookieName, tokens.accessToken, options);
  cookieStore.set(refreshTokenCookieName, tokens.refreshToken, options);
  cookieStore.set(sessionCookieName, encodeSession(session), options);
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(accessTokenCookieName);
  cookieStore.delete(refreshTokenCookieName);
  cookieStore.delete(sessionCookieName);
}
