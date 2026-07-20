// src/lib/config.ts

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.local file and restart the dev server.`
    );
  }
  return value;
}

export const BACKEND_URL = requireEnv(
  "NEXT_PUBLIC_BACKEND_URL",
  process.env.NEXT_PUBLIC_BACKEND_URL
);