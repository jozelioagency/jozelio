import { createAuthClient } from "better-auth/react";

/**
 * Client-side Better-Auth instance for use in React components.
 *
 * Provides hooks and utilities for:
 * - Sign in / Sign up flows
 * - Session management
 * - User profile access
 *
 * Usage:
 *   import { authClient } from "@/lib/auth-client";
 *   const { data: session } = authClient.useSession();
 */
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_APP_DOMAIN === "jozelio.com" ||
  (typeof window !== "undefined" && window.location.hostname.endsWith("jozelio.com"));

const appDomain =
  process.env.NEXT_PUBLIC_APP_DOMAIN ||
  (isProd ? "jozelio.com" : "jozelio.dev");

export const authClient = createAuthClient({
  // Base URL for auth API calls — points to our catch-all route handler.
  // In production, this resolves to https://jozelio.com
  baseURL: isProd ? `https://${appDomain}` : `http://${appDomain}:3000`,
});

/**
 * Convenience re-exports for common auth client methods.
 */
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
