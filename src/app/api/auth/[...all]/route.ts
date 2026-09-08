import { toNextJsHandler } from "better-auth/next-js";
import { createAuth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyTurnstileToken } from "@/lib/turnstile";

/**
 * Better-Auth catch-all API route handler.
 *
 * Intercepts POST authentication requests (like email sign-in) to perform
 * server-side Cloudflare Turnstile bot verification.
 */

export const GET = async (request: Request) => {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      console.error("[Auth API] FATAL: DB binding missing from Cloudflare environment context.");
      return new Response(JSON.stringify({ error: "Database binding missing in Cloudflare" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    const auth = createAuth(env.DB);
    const handler = toNextJsHandler(auth);
    return await handler.GET(request);
  } catch (err: any) {
    console.error("[Auth API GET error]:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const POST = async (request: Request) => {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      console.error("[Auth API] FATAL: DB binding missing from Cloudflare environment context.");
      return new Response(JSON.stringify({ error: "Database binding missing in Cloudflare" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    
    // Intercept sign-in requests for Turnstile validation
    const url = new URL(request.url);
    if (
      url.pathname.endsWith("/sign-in/email") || 
      url.pathname.endsWith("/sign-up/email") || 
      url.pathname.includes("/email-otp")
    ) {
      const turnstileToken = request.headers.get("x-turnstile-token");
      
      const clientIp = request.headers.get("cf-connecting-ip") ?? 
                       request.headers.get("x-forwarded-for")?.split(",")[0] ?? 
                       request.headers.get("x-real-ip") ?? 
                       undefined;

      if (!turnstileToken) {
        // Check if turnstile is configured in env before requiring it
        let secretKey = process.env.TURNSTILE_SECRET_KEY;
        try {
          if (env) {
            secretKey = secretKey || (env as any).TURNSTILE_SECRET_KEY;
          }
        } catch {}

        const isDev = process.env.NODE_ENV !== "production";
        const isTestKey = secretKey?.startsWith("1x000000") || secretKey?.startsWith("2x000000");

        if (secretKey && !isDev && !isTestKey) {
          return new Response(
            JSON.stringify({ error: "Security validation token is missing. Please reload the page." }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
      } else {
        const isValid = await verifyTurnstileToken(turnstileToken, clientIp);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Security check failed. Please refresh the page and try again." }),
            { status: 403, headers: { "content-type": "application/json" } }
          );
        }
      }
    }

    const auth = createAuth(env.DB);
    const handler = toNextJsHandler(auth);
    return await handler.POST(request);
  } catch (err: any) {
    console.error("[Auth API POST error]:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

