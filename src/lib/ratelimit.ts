import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getEnv } from "@/lib/get-env";

let ratelimitInstance: Ratelimit | null = null;

/**
 * Initializes and returns a singleton instance of the Upstash Redis Rate Limiter.
 * Uses getEnv() to reliably read credentials from Cloudflare Workers secrets
 * or local process.env. Returns null if credentials are not configured.
 */
export function getRatelimit(): Ratelimit | null {
  if (ratelimitInstance) return ratelimitInstance;

  const url = getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Jozelio] FATAL: Upstash Redis credentials (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) " +
        "are missing in production. Rate limiting cannot be disabled in production — this is a security requirement. " +
        "Set them via 'wrangler secret put' or add them to your environment."
      );
    }
    console.warn(
      "⚠️ Upstash Redis credentials not configured — rate limiting is bypassed in development."
    );
    return null;
  }

  try {
    const redis = new Redis({ url, token });

    ratelimitInstance = new Ratelimit({
      redis,
      // Default rule: 45 requests per 15 seconds per IP/key
      limiter: Ratelimit.slidingWindow(45, "15 s"),
      analytics: true,
      prefix: "jozelio_ratelimit",
    });

    return ratelimitInstance;
  } catch (error) {
    console.error("Failed to initialize Upstash Redis Client:", error);
    return null;
  }
}
