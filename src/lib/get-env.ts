import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Centralized environment variable retrieval for Cloudflare Workers + Next.js.
 *
 * On Cloudflare Workers, secrets added via `wrangler secret put` are only
 * available through `getCloudflareContext().env`, NOT through `process.env`.
 * This utility checks the Cloudflare context first, then falls back to
 * `process.env` for local development compatibility.
 */
function cleanEnv(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  let trimmed = val.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

export function getEnv(key: string): string | undefined {
  try {
    const ctx = getCloudflareContext();
    const cfValue = (ctx?.env as unknown as Record<string, string | undefined>)?.[key];
    const cleanedCf = cleanEnv(cfValue);
    if (cleanedCf) return cleanedCf;
  } catch {
    // Not running inside a Cloudflare Edge request context (e.g. build time)
  }
  return cleanEnv(process.env[key]);
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
