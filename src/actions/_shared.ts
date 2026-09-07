/**
 * Shared utilities for all server action modules.
 * Centralizes error handling to avoid duplication across action files.
 */

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
