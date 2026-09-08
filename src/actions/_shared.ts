/**
 * Shared utilities for all server action modules.
 * Centralizes error handling and authorization checks to avoid
 * duplication across action files.
 */

import { getEnv } from "@/lib/get-env";

// ─── Authorization Helpers ───────────────────────────────────

/**
 * Checks whether the given session user has Platform Owner privileges.
 *
 * Owner status is determined by:
 * 1. The user's database role being "owner", OR
 * 2. The user's email matching the OWNER_EMAIL environment binding
 *    (set via `wrangler secret put OWNER_EMAIL` in production).
 *
 * Uses getEnv() for consistent Cloudflare Workers + local env access.
 */
export function checkIsOwner(session: {
  user: { email: string; role?: string; [key: string]: unknown };
}): boolean {
  const userRole = (session.user as any).role;
  if (userRole === "owner") return true;

  const ownerEmail = getEnv("OWNER_EMAIL");
  return !!ownerEmail && session.user.email === ownerEmail;
}

/**
 * Checks whether the session user is an admin OR owner.
 * Admins can perform most super-admin operations;
 * Owner-exclusive actions should use checkIsOwner() directly.
 */
export function checkIsAdminOrOwner(session: {
  user: { email: string; role?: string; [key: string]: unknown };
}): boolean {
  const userRole = (session.user as any).role;
  return userRole === "admin" || checkIsOwner(session);
}

// ─── Error Handling ──────────────────────────────────────────

/**
 * Normalizes action errors into a user-safe error response.
 * Catches D1/SQLite internal messages and replaces them with a generic DB error.
 */
export function handleActionError(error: unknown, fallback: string): { error: string } {
  console.error(`[Action Error] ${fallback}:`, error);
  const msg = error instanceof Error ? error.message : "";
  if (
    msg.includes("Failed query") ||
    msg.includes("SQLITE_ERROR") ||
    msg.includes("D1_")
  ) {
    return {
      error:
        "A database error occurred while processing your request. Please try again or contact support if the issue persists.",
    };
  }
  return { error: msg || fallback };
}

/** Maximum allowed lengths for free-text user inputs to prevent DB bloat */
export const MAX_LENGTHS = {
  name: 100,
  businessName: 120,
  menuItemName: 150,
  description: 500,
  category: 80,
  location: 200,
  url: 500,
  reason: 300,
  notificationTitle: 150,
  notificationMessage: 1000,
  username: 20,
  nickname: 50,
  bio: 300,
} as const;

/**
 * Validates that a string does not exceed a maximum length.
 * Returns an error object if exceeded, or null if valid.
 */
export function validateLength(
  value: string | null | undefined,
  field: string,
  max: number
): { error: string } | null {
  if (value && value.length > max) {
    return { error: `${field} must be ${max} characters or fewer.` };
  }
  return null;
}
