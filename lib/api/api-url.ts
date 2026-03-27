import { env } from "@/lib/config/env";

export function buildApiUrl(path: string): string {
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
