function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function readApiBaseUrl(): string {
  const value = readRequiredEnv("API_BASE_URL");
  const url = new URL(value);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("API_BASE_URL must use HTTPS in production.");
  }

  return value;
}

export const env = {
  get apiBaseUrl(): string {
    return readApiBaseUrl();
  },
  get sessionSecret(): string {
    return readRequiredEnv("SESSION_SECRET");
  },
  cookieSecure: process.env.NODE_ENV === "production",
};
