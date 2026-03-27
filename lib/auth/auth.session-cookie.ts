import { createHmac, timingSafeEqual } from "node:crypto";

import type { SessionData } from "@/lib/auth/auth.types";
import { env } from "@/lib/config/env";

function signSessionValue(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("hex");
}

export function encodeSessionCookie(session: SessionData): string {
  const payload = JSON.stringify(session);
  const signature = signSessionValue(payload);
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");

  return `${encodedPayload}.${signature}`;
}

export function decodeSessionCookie(value: string): SessionData | null {
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
