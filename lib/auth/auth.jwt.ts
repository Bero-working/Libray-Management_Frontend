const millisecondsInSecond = 1000;
const defaultRefreshWindowInSeconds = 30;

interface JwtPayload {
  exp?: number;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

function getTokenExpiryTimestamp(token: string): number | null {
  const payload = decodeJwtPayload(token);

  if (typeof payload?.exp !== "number") {
    return null;
  }

  return payload.exp * millisecondsInSecond;
}

export function shouldRefreshToken(
  token: string,
  refreshWindowInSeconds = defaultRefreshWindowInSeconds,
  now = Date.now()
): boolean {
  const expiryTimestamp = getTokenExpiryTimestamp(token);

  if (expiryTimestamp === null) {
    return true;
  }

  return expiryTimestamp <= now + refreshWindowInSeconds * millisecondsInSecond;
}
