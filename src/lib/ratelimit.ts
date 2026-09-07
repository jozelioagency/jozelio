import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getCloudflareContext } from "@opennextjs/cloudflare";

let ratelimitInstance: Ratelimit | null = null;

/**
 * Initializes and returns a singleton instance of the Upstash Redis Rate Limiter.
 * Gracefully falls back to null if credentials are not configured, preventing startup crashes.
 */
export function getRatelimit(): Ratelimit | null {
  if (ratelimitInstance) return ratelimitInstance;

  let url = process.env.UPSTASH_REDIS_REST_URL;
  let token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Retrieve environment bindings dynamically from Cloudflare Edge context if available
  try {
    const cfContext = getCloudflareContext();
    if (cfContext?.env) {
      url = url || (cfContext.env as any).UPSTASH_REDIS_REST_URL;
      token = token || (cfContext.env as any).UPSTASH_REDIS_REST_TOKEN;
    }
  } catch {
    // Not running inside a Cloudflare Edge request/build context
  }

  if (!url || !token) {
    return null;
  }

  try {
    const redis = new Redis({
      url,
      token,
    });

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
