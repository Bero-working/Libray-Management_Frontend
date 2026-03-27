import { redirect } from "next/navigation";

import type { AccountRole, AuthTokens, SessionData } from "@/lib/auth/auth.types";
import {
  clearSessionCookies,
  readAuthTokens,
  readSessionData,
  writeSessionCookies,
} from "@/lib/auth/auth.cookies";
import { APP_ROUTES, ROLE_HOME_ROUTES } from "@/lib/config/routes";

export interface Session {
  tokens: AuthTokens;
  sessionData: SessionData;
}

export async function getSession(): Promise<Session | null> {
  const [tokens, sessionData] = await Promise.all([
    readAuthTokens(),
    readSessionData(),
  ]);

  if (!tokens || !sessionData) {
    if (tokens || sessionData) {
      await clearSessionCookies();
    }

    return null;
  }

  return {
    tokens,
    sessionData,
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect(APP_ROUTES.login);
  }

  return session;
}

export function getDefaultRouteForRole(role: AccountRole): string {
  return ROLE_HOME_ROUTES[role];
}

export async function persistSession(session: Session): Promise<void> {
  await writeSessionCookies(session.tokens, session.sessionData);
}

export async function destroySession(): Promise<void> {
  await clearSessionCookies();
}
