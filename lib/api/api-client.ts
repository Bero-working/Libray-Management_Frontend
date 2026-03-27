import type { AuthTokens, LoginResponse, SessionData } from "@/lib/auth/auth.types";
import {
  clearSessionCookies,
  readAuthTokens,
  readSessionData,
  writeSessionCookies,
} from "@/lib/auth/auth.cookies";
import { ApiError } from "@/lib/api/api-errors";
import { authEndpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/config/env";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

function buildUrl(path: string): string {
  const baseUrl = new URL(env.apiBaseUrl);

  if (!baseUrl.pathname.endsWith("/")) {
    baseUrl.pathname = `${baseUrl.pathname}/`;
  }

  const normalizedPath = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)
    ? path
    : path.replace(/^\/+/, "");
  const url = new URL(normalizedPath, baseUrl);

  if (url.origin !== new URL(env.apiBaseUrl).origin) {
    throw new Error("Cross-origin API requests are not allowed.");
  }

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new ApiError(
      payload.error?.message ?? "Request failed.",
      response.status,
      payload.error?.code
    );
  }

  return payload.data;
}

async function refreshTokens(
  tokens: AuthTokens,
  sessionData: SessionData
): Promise<AuthTokens> {
  const response = await fetch(buildUrl(authEndpoints.refresh), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: tokens.refreshToken,
    }),
    cache: "no-store",
  });

  const refreshedTokens = await parseResponse<RefreshResponse>(response);

  await writeSessionCookies(refreshedTokens, sessionData);

  return refreshedTokens;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    retryOnUnauthorized = true,
    headers,
    body,
    ...rest
  } = options;

  const tokens = skipAuth ? null : await readAuthTokens();
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (tokens?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: requestHeaders,
    body,
    cache: "no-store",
  });

  if (response.status === 401 && !skipAuth && retryOnUnauthorized) {
    const sessionData = await readSessionData();

    if (!tokens || !sessionData) {
      await clearSessionCookies();
      throw new ApiError("Session expired.", 401, "SESSION_EXPIRED");
    }

    try {
      const refreshedTokens = await refreshTokens(tokens, sessionData);

      return apiRequest<T>(path, {
        ...options,
        headers: {
          ...Object.fromEntries(requestHeaders.entries()),
          Authorization: `Bearer ${refreshedTokens.accessToken}`,
        },
        retryOnUnauthorized: false,
      });
    } catch {
      await clearSessionCookies();
      throw new ApiError("Session expired.", 401, "SESSION_EXPIRED");
    }
  }

  return parseResponse<T>(response);
}

export async function loginRequest(
  username: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(authEndpoints.login, {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function logoutRequest(): Promise<void> {
  const tokens = await readAuthTokens();

  if (!tokens) {
    await clearSessionCookies();
    return;
  }

  try {
    await apiRequest<{ message: string }>(authEndpoints.logout, {
      method: "POST",
      skipAuth: true,
      retryOnUnauthorized: false,
      body: JSON.stringify({
        refreshToken: tokens.refreshToken,
      }),
    });
  } finally {
    await clearSessionCookies();
  }
}
