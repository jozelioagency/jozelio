import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getRatelimit } from "@/lib/ratelimit";
import { getEnv } from "@/lib/get-env";

/**
 * Root domain used for subdomain extraction.
 * In development: jozelio.dev
 * In production:  jozelio.com
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "jozelio.dev";

/**
 * Paths that should never be intercepted by subdomain routing.
 * These are passed through directly to Next.js.
 */
const BYPASS_PREFIXES = [
  "/_next",       // Next.js internals (static, image, data)
  "/api",         // API routes (auth, uploads, etc.)
  "/favicon.ico", // Browser favicon
];

/**
 * File extensions for static assets that should bypass middleware.
 */
const STATIC_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css|js|map)$/i;

/**
 * Extracts the subdomain from a hostname.
 *
 * Examples:
 *   "gustopizza.jozelio.dev:3000" → "gustopizza"
 *   "burgerbox.jozelio.com"         → "burgerbox"
 *   "jozelio.dev:3000"            → null
 *   "www.jozelio.dev"             → null (www is treated as root)
 *   "localhost:3000"                → null
 */
function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(":")[0];

  // Must end with our root domain
  if (!host.endsWith(ROOT_DOMAIN)) {
    return null;
  }

  // Extract the part before the root domain
  const prefix = host.slice(0, -(ROOT_DOMAIN.length + 1)); // +1 for the dot

  // No subdomain, empty string, or "www" → treat as main site
  if (!prefix || prefix === "www") {
    return null;
  }

  return prefix;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // ─── Bypass: Static assets and known system paths ─────────
  const isStatic = pathname.startsWith("/_next") || 
                   pathname === "/favicon.ico" || 
                   STATIC_EXTENSIONS.test(pathname);

  if (isStatic) {
    return NextResponse.next();
  }

  const isBypass = BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isBypass) {
    return NextResponse.next();
  }

  // ─── Rate Limiting Layer (IP-based sliding window) ───────────
  const ratelimiter = getRatelimit();
  if (ratelimiter) {
    const ip = request.headers.get("cf-connecting-ip") ?? 
               request.headers.get("x-forwarded-for")?.split(",")[0] ?? 
               request.headers.get("x-real-ip") ?? 
               "127.0.0.1";

    const subdomain = extractSubdomain(hostname);
    const host = hostname.split(":")[0];
    let customRateLimit: number | null = null;

    if (subdomain || (host !== ROOT_DOMAIN && host !== "localhost")) {
      try {
        const { env } = getCloudflareContext();
        if (env?.DB) {
          const db = drizzle(env.DB, { schema });
          let tenant;
          if (subdomain) {
            tenant = await db
              .select({ customRateLimit: schema.tenants.customRateLimit })
              .from(schema.tenants)
              .where(eq(schema.tenants.subdomain, subdomain))
              .get();
          } else {
            tenant = await db
              .select({ customRateLimit: schema.tenants.customRateLimit })
              .from(schema.tenants)
              .where(eq(schema.tenants.customDomain, host))
              .get();
          }
          if (tenant && tenant.customRateLimit !== null && tenant.customRateLimit !== undefined) {
            customRateLimit = tenant.customRateLimit;
          }
        }
      } catch (err) {
        console.error("Middleware fetch custom rate limit error:", err);
      }
    }

    const rateKey = customRateLimit ? `rate:${ip}:${subdomain || host}` : `rate:${ip}`;
    try {
      let result;
      if (customRateLimit !== null && customRateLimit !== undefined) {
        if (customRateLimit === 0) {
          result = { success: true, limit: 0, reset: 0, remaining: 9999 };
        } else {
          const url = getEnv("UPSTASH_REDIS_REST_URL");
          const token = getEnv("UPSTASH_REDIS_REST_TOKEN");
          if (url && token) {
            const { Redis } = await import("@upstash/redis");
            const { Ratelimit } = await import("@upstash/ratelimit");
            const redis = new Redis({ url, token });
            const customLimiter = new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(customRateLimit, "15 s"),
              analytics: true,
              prefix: "jozelio_ratelimit",
            });
            result = await customLimiter.limit(rateKey);
          } else {
            result = await ratelimiter.limit(rateKey);
          }
        }
      } else {
        result = await ratelimiter.limit(rateKey);
      }

      const { success, limit, reset, remaining } = result;
      if (!success) {
        return new NextResponse(
          JSON.stringify({
            error: "Too many requests. Please try again later.",
            limit,
            remaining,
            reset,
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(Math.ceil((reset - Date.now()) / 1000)),
            },
          }
        );
      }
    } catch (err) {
      console.error("Rate limit check failed:", err);
    }
  }

  // ─── Subdomain extraction ────────────────────────────────
  const subdomain = extractSubdomain(hostname);

  // ─── Admin protection ───────────────────────────────────
  // Note: We used to block direct access here if not on 'admins' subdomain, 
  // but it's more convenient to allow direct path access for ease of use.
  // The actual layout strictly enforces database role authorization anyway.

  // ─── Admins subdomain routing ───────────────────────────
  if (subdomain === "admins") {
    // If they access the underlying admin paths directly, redirect to root
    if (pathname === "/jozelio-admin" || pathname === "/super-admin") {
      if (request.headers.get("x-rewritten-admin") === "true") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    const rewriteUrl = new URL(
      `/jozelio-admin${pathname === "/" ? "" : pathname}`,
      request.url
    );
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-rewritten-admin", "true");
    return response;
  }

  // ─── Custom Domain Lookup (with Redis cache) ────────────
  // Cache the custom domain → subdomain mapping for 5 minutes to avoid
  // hitting D1 on every request. Falls back to direct D1 query on cache miss.
  const host = hostname.split(":")[0];
  if (!subdomain && host !== ROOT_DOMAIN && host !== "localhost") {
    try {
      const { env } = getCloudflareContext();
      if (env?.DB) {
        const cacheKey = `customdomain:${host}`;
        let tenantSubdomain: string | null = null;
        let tenantTier: string | null = null;

        // Try Redis cache first
        const redisUrl = getEnv("UPSTASH_REDIS_REST_URL");
        const redisToken = getEnv("UPSTASH_REDIS_REST_TOKEN");
        let redisClient: import("@upstash/redis").Redis | null = null;

        if (redisUrl && redisToken) {
          try {
            const { Redis } = await import("@upstash/redis");
            redisClient = new Redis({ url: redisUrl, token: redisToken });
            const cached = await redisClient.get<{ subdomain: string; tier: string }>(cacheKey);
            if (cached) {
              tenantSubdomain = cached.subdomain;
              tenantTier = cached.tier;
            }
          } catch {
            // Redis unavailable, fall through to D1
          }
        }

        // Cache miss — query D1
        if (!tenantSubdomain) {
          const db = drizzle(env.DB, { schema });
          const tenant = await db
            .select({ subdomain: schema.tenants.subdomain, tier: schema.tenants.tier })
            .from(schema.tenants)
            .where(eq(schema.tenants.customDomain, host))
            .get();

          if (tenant) {
            tenantSubdomain = tenant.subdomain;
            tenantTier = tenant.tier;
            // Write to Redis cache with 5-minute TTL
            if (redisClient) {
              try {
                await redisClient.set(cacheKey, { subdomain: tenant.subdomain, tier: tenant.tier }, { ex: 300 });
              } catch { /* Non-fatal: Redis write failure */ }
            }
          }
        }

        if (tenantSubdomain && tenantTier !== "free") {
          if (pathname === "/manifest.json") {
            const manifestUrl = new URL(`/storefronts/${tenantSubdomain}/manifest`, request.url);
            return NextResponse.rewrite(manifestUrl);
          }
          const rewriteUrl = new URL(`/storefronts/${tenantSubdomain}${pathname}`, request.url);
          const response = NextResponse.rewrite(rewriteUrl);
          response.headers.set("x-tenant-subdomain", tenantSubdomain);
          return response;
        }
      }
    } catch (err) {
      console.error("Middleware custom domain lookup error:", err);
    }
  }

  // No subdomain → main marketing site
  if (!subdomain) {
    return NextResponse.next();
  }

  // ─── Storefront manifest.json rewrite ────────────────────
  // Intercept /manifest.json on tenant subdomains and route to
  // the dynamic PWA manifest endpoint
  if (pathname === "/manifest.json") {
    const manifestUrl = new URL(
      `/storefronts/${subdomain}/manifest`,
      request.url
    );
    return NextResponse.rewrite(manifestUrl);
  }

  // ─── Storefront page rewrite ─────────────────────────────
  // Transparently rewrite all tenant subdomain traffic to the
  // storefronts route group: /storefronts/[subdomain]/...
  const rewriteUrl = new URL(
    `/storefronts/${subdomain}${pathname}`,
    request.url
  );

  // Pass the subdomain downstream so server components can
  // access it without re-parsing the Host header
  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set("x-tenant-subdomain", subdomain);

  return response;
}

/**
 * Middleware matcher — run on all routes EXCEPT Next.js internals
 * and static file extensions. This is a performance optimization;
 * the middleware function also has its own bypass logic as a safety net.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next (Next.js internals and HMR)
     * - favicon.ico (browser favicon)
     * - Files with common static extensions
     */
    "/((?!_next|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
