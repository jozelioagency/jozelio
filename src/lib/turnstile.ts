import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Verifies a Cloudflare Turnstile response token against the siteverify API.
 * Gracefully falls back to true (bypassed) if credentials are not configured.
 *
 * @param token The Turnstile response token submitted by the client
 * @param ip Optional client IP address
 */
export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  let secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Retrieve environment secret dynamically from Cloudflare Edge context if available
  try {
    const cfContext = getCloudflareContext();
    if (cfContext?.env) {
      secretKey = secretKey || (cfContext.env as any).TURNSTILE_SECRET_KEY;
    }
  } catch {
    // Not running inside a Cloudflare Edge request context
  }

  // Handle missing secret key based on environment
  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("🚨 CRITICAL SECURITY ALERT: TURNSTILE_SECRET_KEY is missing in production. Failing closed.");
      return false;
    }
    console.warn("⚠️ TURNSTILE_SECRET_KEY is not configured. Turnstile verification is bypassed in development.");
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(siteverifyUrl, {
      method: "POST",
      body: formData,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const outcome = (await response.json()) as { success: boolean; "error-codes"?: string[] };
    return outcome.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
