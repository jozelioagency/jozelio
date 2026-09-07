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
export const authClient = createAuthClient({
  // Base URL for auth API calls — points to our catch-all route handler.
  // In production, this should be the canonical domain.
  baseURL:
    process.env.NEXT_PUBLIC_APP_DOMAIN === "jozelio.com"
      ? "https://jozelio.com"
      : `http://${process.env.NEXT_PUBLIC_APP_DOMAIN || "jozelio.dev"}:3000`,
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
