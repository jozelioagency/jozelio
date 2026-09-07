import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Centralized environment variable retrieval for Cloudflare Workers + Next.js.
 *
 * On Cloudflare Workers, secrets added via `wrangler secret put` are only
 * available through `getCloudflareContext().env`, NOT through `process.env`.
 * This utility checks the Cloudflare context first, then falls back to
 * `process.env` for local development compatibility.
 */
export function getEnv(key: string): string | undefined {
  try {
    const ctx = getCloudflareContext();
    const cfValue = (ctx?.env as unknown as Record<string, string | undefined>)?.[key];
    if (cfValue) return cfValue;
  } catch {
    // Not running inside a Cloudflare Edge request context (e.g. build time)
  }
  return process.env[key];
}

/**
 * Same as getEnv but throws a descriptive error if the variable is missing.
 * Use for secrets that are absolutely required at runtime.
 */
export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(
      `[Jozelio] FATAL: Required environment variable "${key}" is missing. ` +
      `Set it via "wrangler secret put ${key}" for production, or add it to .env for local dev.`
    );
  }
  return value;
}
