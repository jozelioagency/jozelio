import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import * as schema from "@/db/schema";
import {
  verificationEmailHtml,
  resetPasswordEmailHtml,
  otpEmailHtml,
  type OtpType,
} from "@/lib/email-templates";

// ─── Constants ───────────────────────────────────────────────
/**
 * The root domain used for cookie scoping.
 * Leading dot enables cross-subdomain cookie sharing.
 */
const COOKIE_DOMAIN = `.${process.env.NEXT_PUBLIC_APP_DOMAIN || "jozelio.dev"}`;
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * "From" address used for all security/auth outbound emails.
 */
const FROM_SECURITY_EMAIL = process.env.RESEND_SECURITY_EMAIL || "Jozelio Security <security@mail.jozelio.com>";

// ─── Resend Client ────────────────────────────────────────────
/**
 * Lazily instantiated Resend client.
 *
 * We create it once here (module-level) because Resend is a plain HTTP
 * client — it holds no I/O resources, so instantiation at module scope is
 * safe even on the Cloudflare Edge runtime.
 *
 * NOTE: process.env.RESEND_API_KEY is read at call-time on the Edge, so
 * the value must be bound via `wrangler.toml` secrets or Cloudflare's
 * Secrets Store before deploy.
 */
const getResend = (): Resend => new Resend(process.env.RESEND_API_KEY);

// ─── Shared Email Helper ─────────────────────────────────────
/**
 * Fire-and-forget email dispatch.
 *
 * On the Edge runtime we MUST NOT `await` arbitrary Promises that outlive
 * the response boundary — doing so can either block the response or be
 * silently dropped. Instead we use `void` + a `waitUntil`-style pattern:
 * the Promise is kicked off, any error is caught synchronously into a
 * console.error so the auth flow never throws, and the response is free
 * to complete.
 */
function sendEmailAsync(payload: Parameters<Resend["emails"]["send"]>[0]): void {
  void getResend()
    .emails.send(payload)
    .then((res) => {
      if (res.error) {
        console.error("[Jozelio/Resend] Email delivery error:", res.error);
      }
    })
    .catch((err: unknown) => {
      console.error("[Jozelio/Resend] Unhandled email send failure:", err);
    });
}

// ─── Auth Factory ─────────────────────────────────────────────
/**
 * Factory function that creates a Better-Auth instance bound to a D1 database.
 *
 * Why a factory? Cloudflare Workers are stateless — the D1 binding is only
 * available within a request context via `getCloudflareContext()`. We cannot
 * create a global auth singleton at module level.
 *
 * Usage in route handlers:
 *   const { env } = getCloudflareContext();
 *   const auth = createAuth(env.DB);
 */
export function createAuth(d1: D1Database) {
  const db = drizzle(d1, { schema });

  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (!authSecret && IS_PROD) {
    throw new Error("FATAL: BETTER_AUTH_SECRET environment variable is missing in production.");
  }

  return betterAuth({
    secret: authSecret || "jozelio_dev_secret_only",
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),

    // ─── Dynamic Base URL ─────────────────────────────────
    // Better-Auth derives the host from incoming request headers.
    // allowedHosts validates against trusted origins to prevent
    // host header injection attacks.
    baseURL: {
      allowedHosts: [
        "localhost:3000",
        "jozelio.dev:3000",
        "*.jozelio.dev:3000",
        "*.jozelio.dev",
        "*.jozelio.com",
      ],
      protocol: IS_PROD ? "https" : "http",
    },

    // ─── Cross-Subdomain Cookie Configuration ─────────────
    // Enables session sharing across all tenant subdomains
    // (e.g., gustopizza.jozelio.dev can read cookies set by jozelio.dev)
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: COOKIE_DOMAIN,
      },
      defaultCookieAttributes: {
        // "none" is required in production for cross-domain cookie access,
        // but requires secure: true. In development over HTTP, we use "lax".
        sameSite: IS_PROD ? "none" : "lax",
        secure: IS_PROD,
        httpOnly: true,
      },
    },

    // ─── Session Configuration ────────────────────────────
    session: {
      // Store sessions in D1 for edge-compatible persistence
      storeSessionInDatabase: true,
      // 7-day session expiry
      expiresIn: 60 * 60 * 24 * 7,
      // Refresh session when 1 day remains
      updateAge: 60 * 60 * 24,
    },

    // ─── Account Linking Configuration ─────────────────────
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },

    // ─── Social Login Providers ──────────────────────────
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
      },
    },

    // ─── Email & Password Auth ────────────────────────────
    emailAndPassword: {
      enabled: true,

      /**
       * Fired when the user requests a password reset.
       * We kick off the Resend call asynchronously so the HTTP response
       * is never blocked by email delivery latency.
       */
      sendResetPassword: async ({
        user,
        url,
        token: _token,
      }: {
        user: { id: string; name: string; email: string };
        url: string;
        token: string;
      }) => {
        sendEmailAsync({
          from: FROM_SECURITY_EMAIL,
          to: user.email,
          subject: "Reset your Jozelio password",
          html: resetPasswordEmailHtml(user.name, url),
        });
      },
    },

    // ─── Email Verification ───────────────────────────────
    emailVerification: {
      /**
       * Fired after sign-up to prompt the user to verify their address.
       * Fire-and-forget: the registration response is never held up.
       */
      sendVerificationEmail: async ({
        user,
        url,
        token: _token,
      }: {
        user: { id: string; name: string; email: string };
        url: string;
        token: string;
      }) => {
        sendEmailAsync({
          from: FROM_SECURITY_EMAIL,
          to: user.email,
          subject: "Verify your Jozelio email",
          html: verificationEmailHtml(user.name, url),
        });
      },
    },

    // ─── Plugins ──────────────────────────────────────────
    plugins: [
      /**
       * Email OTP Plugin — supports:
       *  - "sign-in"            → passwordless sign-in via OTP
       *  - "email-verification" → verify email with OTP instead of link
       *  - "forget-password"    → reset password with OTP instead of link
       */
      emailOTP({
        otpLength: 6,
        expiresIn: 600, // 10 minutes in seconds

        /**
         * Called for all OTP types. We receive the email, the generated OTP,
         * and the `type` discriminant — all we need to produce the right email.
         */
        sendVerificationOTP: async ({
          email,
          otp,
          type,
        }: {
          email: string;
          otp: string;
          type: OtpType;
        }) => {
          const subjectMap: Record<OtpType, string> = {
            "sign-in": "Your Jozelio sign-in code",
            "email-verification": "Verify your Jozelio email",
            "forget-password": "Your Jozelio password reset code",
            "change-email": "Confirm your new Jozelio email",
          };

          sendEmailAsync({
            from: FROM_SECURITY_EMAIL,
            to: email,
            subject: subjectMap[type],
            html: otpEmailHtml(otp, type),
          });
        },
      }),
    ],

    // ─── User Profile Options ─────────────────────────────
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
        },
        username: {
          type: "string",
          required: false,
        },
        nickname: {
          type: "string",
          required: false,
        },
        phoneNumber: {
          type: "string",
          required: false,
        },
      },
    },
  });
}

/**
 * Type export for the auth instance.
 * Useful for typing server-side session checks.
 */
export type Auth = ReturnType<typeof createAuth>;
