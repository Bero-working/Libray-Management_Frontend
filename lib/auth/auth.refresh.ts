import { ApiError } from "@/lib/api/api-errors";
import { buildApiUrl } from "@/lib/api/api-url";
import { authEndpoints } from "@/lib/api/endpoints";
import type { AuthTokens } from "@/lib/auth/auth.types";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

async function buildRefreshError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as ApiEnvelope<unknown>;

      return new ApiError(
        payload.error?.message ?? "Session refresh failed.",
        response.status,
        payload.error?.code
      );
    } catch {
      return new ApiError("Session refresh failed.", response.status);
    }
  }

  try {
    const message = (await response.text()).trim();

    return new ApiError(message || "Session refresh failed.", response.status);
  } catch {
    return new ApiError("Session refresh failed.", response.status);
  }
}

export async function requestTokenRefresh(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(buildApiUrl(authEndpoints.refresh), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await buildRefreshError(response);
  }

  try {
    const payload = (await response.json()) as ApiEnvelope<AuthTokens>;

    if (payload.success && payload.data?.accessToken && payload.data?.refreshToken) {
      return payload.data;
    }
  } catch {
    // Fall through to the generic error below.
  }

  throw new ApiError("Session refresh failed.", response.status);
}
