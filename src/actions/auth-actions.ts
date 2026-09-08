"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, count, and, ne, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { invitationEmailHtml, systemNoticeEmail } from "@/lib/email-templates";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getRatelimit } from "@/lib/ratelimit";
import { handleActionError, validateLength, MAX_LENGTHS } from "./_shared";
import { getEnv } from "@/lib/get-env";



const RESERVED_SUBDOMAINS = ["www", "api", "admin", "jozelio", "portal", "media", "auth", "static", "assets"];


/**
 * Server action to register a generic user profile.
 */
export async function registerUser(formData: Record<string, string>) {
  try {
    const { name, email, password, username, country, turnstileToken } = formData;

    if (!name || !email || !password || !username) {
      return { error: "All fields are required" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // Check if registrations are disabled
    try {
      await db.run(sql`CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`);
      const disableReg = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, "disable_registrations")).get();
      if (disableReg && disableReg.value === "true") {
        return { error: "Registrations are currently closed by the platform administrator." };
      }
    } catch (err) {
      console.error("Failed to check registrations status:", err);
    }

    const clientHeaders = await headers();
    const clientIp = clientHeaders.get("cf-connecting-ip") ?? 
                     clientHeaders.get("x-forwarded-for")?.split(",")[0] ?? 
                     clientHeaders.get("x-real-ip") ?? 
                     undefined;

    // Turnstile bot prevention validation
    const turnstileSecretKey = getEnv("TURNSTILE_SECRET_KEY");
    const isDev = process.env.NODE_ENV !== "production";
    const isTestKey = turnstileSecretKey?.startsWith("1x000000") || turnstileSecretKey?.startsWith("2x000000");

    if (!turnstileToken) {
      if (turnstileSecretKey && !isDev && !isTestKey) {
        return { error: "Security check token is missing. Please reload the page." };
      }
    } else {
      const isHuman = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!isHuman && !isTestKey && !isDev) {
        return { error: "Security check failed. Please refresh the page and try again." };
      }
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,20}$/.test(cleanUsername)) {
      return { error: "Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores." };
    }

    // Check if username is already taken
    const existingUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.username, cleanUsername))
      .get();

    if (existingUser) {
      return { error: "Username is already taken" };
    }

    const auth = createAuth(env.DB);

    let userResult;
    try {
      userResult = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          username: cleanUsername,
        },
        headers: await headers(),
      });
    } catch (authError: any) {
      console.error("Better-Auth sign up error:", authError);
      return { error: authError?.message || "Failed to create user account" };
    }

    if (!userResult || !userResult.user) {
      return { error: "Failed to create user account" };
    }

    if (country) {
      await db
        .update(schema.user)
        .set({ country })
        .where(eq(schema.user.id, userResult.user.id))
        .run();
    }

    return { success: true };
  } catch (error: any) {
    console.error("registerUser action error:", error);
    return { error: error?.message || "Internal server error during registration" };
  }
}

/**
 * Server action to complete user onboarding (first-time social login users).
 * Saves the required username, and optional nickname and avatar URL.
 */
export async function completeUserOnboarding(data: {
  username: string;
  nickname?: string;
  image?: string;
  country?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { username, nickname, image, country } = data;

    if (!username) {
      return { error: "Username is required" };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,20}$/.test(cleanUsername)) {
      return { error: "Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores." };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // Check if username is already taken by another user
    const existingUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.username, cleanUsername))
      .get();

    if (existingUser) {
      return { error: "Username is already taken. Please choose another one." };
    }

    await db
      .update(schema.user)
      .set({
        username: cleanUsername,
        nickname: nickname ? nickname.trim() || null : null,
        image: image || session.user.image || null,
        country: country || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id))
      .run();

    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("completeUserOnboarding error:", error);
    return { error: error?.message || "Failed to complete onboarding" };
  }
}

/**
 * Server action to get email address associated with a username.
 * Used to support email or username sign-in.
 *
 * Rate limited by IP to prevent email enumeration attacks.
 */
export async function getEmailByUsername(username: string) {
  try {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      return { error: "Username is required" };
    }

    // ─── Rate Limiting (anti-enumeration) ──────────────────
    const rl = getRatelimit();
    if (rl) {
      const hdrs = await headers();
      const ip =
        hdrs.get("cf-connecting-ip") ??
        hdrs.get("x-forwarded-for")?.split(",")[0] ??
        hdrs.get("x-real-ip") ??
        "unknown";
      const { success } = await rl.limit(`username_lookup:${ip}`);
      if (!success) {
        return { error: "Too many requests. Please wait a moment and try again." };
      }
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const user = await db
      .select({ email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.username, cleanUsername))
      .get();

    if (!user) {
      return { error: "Username not found" };
    }

    return { email: user.email };
  } catch (error: any) {
    console.error("getEmailByUsername error:", error);
    return { error: error?.message || "Failed to resolve username" };
  }
}

/**
 * Server action for a user to permanently delete their own account.
 */
export async function deleteOwnAccount() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userId = session.user.id;
    const userEmail = session.user.email;
    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // 1. Ensure user does not own any active tenants
    const ownedTenants = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.userId, userId))
      .all();

    if (ownedTenants.length > 0) {
      return {
        error: `Cannot delete account: You currently own ${ownedTenants.length} active project workspace(s) (${ownedTenants.map(t => t.businessName).join(", ")}). You must delete your projects first from their settings.`,
      };
    }

    // 2. Delete tenant membership invitations / roles mapped to this user's email
    await db
      .delete(schema.tenantMembers)
      .where(eq(schema.tenantMembers.email, userEmail))
      .run();

    // 3. Delete user record (cascades to session, account tables)
    await db
      .delete(schema.user)
      .where(eq(schema.user.id, userId))
      .run();

    return { success: true };
  } catch (error: any) {
    console.error("deleteOwnAccount error:", error);
    return { error: error?.message || "Failed to delete account" };
  }
}

