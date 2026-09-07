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

function handleActionError(error: any, fallback: string) {
  console.error(`[Action Error] ${fallback}:`, error);
  const msg = error?.message || "";
  if (msg.includes("Failed query") || msg.includes("SQLITE_ERROR") || msg.includes("D1_")) {
    return { error: "A database error occurred while processing your request. Please try again or contact support if the issue persists." };
  }
  return { error: msg || fallback };
}

const RESERVED_SUBDOMAINS = ["www", "api", "admin", "jozelio", "portal", "media", "auth", "static", "assets"];
import { checkUserProjectPermission } from "./tenant-actions";


/**
 * Server action to delete a tenant project completely.
 * Only callable by admin or owner role.
 */
export async function deleteTenantByAdmin(tenantId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role; const isSuperAdmin = userRole === "admin" || userRole === "owner";
    if (!isSuperAdmin) {
      return { error: "Unauthorized: Super Admin access required" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
    const isOwner = session.user.email === ownerEmail;

    if (!isOwner) {
      const targetTenant = await db
        .select({ isBanned: schema.tenants.isBanned })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .get();

      if (!targetTenant?.isBanned) {
        return { error: "Access Denied: Standard operators can only delete storefront projects that are banned/suspended." };
      }
    }

    // 1. Delete all menu items
    await db
      .delete(schema.menuItems)
      .where(eq(schema.menuItems.tenantId, tenantId))
      .run();

    // 2. Delete all tenant members
    await db
      .delete(schema.tenantMembers)
      .where(eq(schema.tenantMembers.tenantId, tenantId))
      .run();

    // 3. Delete the tenant itself
    await db
      .delete(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("deleteTenantByAdmin error:", error);
    return { error: error?.message || "Failed to delete tenant project" };
  }
}

/**
 * Server action to update a user's role on the platform.
 * Only callable by admin or owner role. Prevents self-modification.
 */
export async function updateUserRoleByAdmin(
  targetUserId: string,
  newRole: "user" | "admin" | "owner"
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    const { env } = getCloudflareContext();
    const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
    const isOwner = session.user.email === ownerEmail || userRole === "owner";
    const isAdminOrOwner = userRole === "admin" || isOwner;

    if (!isAdminOrOwner) {
      return { error: "Unauthorized: Admin access required" };
    }

    if (newRole === "owner" && !isOwner) {
      return { error: "Unauthorized: Only an Owner can assign the Owner role" };
    }

    const db = drizzle(env.DB, { schema });

    const targetUser = await db.select({ role: schema.user.role }).from(schema.user).where(eq(schema.user.id, targetUserId)).get();
    if (targetUser?.role === "owner" && !isOwner) {
      return { error: "Unauthorized: Only an Owner can modify an Owner account" };
    }

    // Prevent modifying self
    if (session.user.id === targetUserId) {
      return { error: "Security violation: Cannot modify your own role" };
    }

    await db
      .update(schema.user)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(schema.user.id, targetUserId))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserRoleByAdmin error:", error);
    return { error: error?.message || "Failed to update user role" };
  }
}

/**
 * Server action to delete a user account from the platform.
 * Only callable by admin or owner role. Prevents self-deletion.
 * Prevents deletion if the user owns active tenant projects.
 */
export async function deleteUserByAdmin(targetUserId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role; const isSuperAdmin = userRole === "admin" || userRole === "owner";
    if (!isSuperAdmin) {
      return { error: "Unauthorized: Super Admin access required" };
    }

    // Prevent deleting self
    if (session.user.id === targetUserId) {
      return { error: "Security violation: Cannot delete your own active session account" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // Ensure they do not own any active tenants
    const ownedTenants = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.userId, targetUserId))
      .all();

    if (ownedTenants.length > 0) {
      return {
        error: `Cannot delete user: This user owns ${ownedTenants.length} active project storefront(s) (${ownedTenants.map(t => t.businessName).join(", ")}). Please delete the projects first.`,
      };
    }

    // Delete tenant member associations for this user
    const targetUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, targetUserId))
      .get();

    if (targetUser) {
      await db
        .delete(schema.tenantMembers)
        .where(eq(schema.tenantMembers.email, targetUser.email))
        .run();
    }

    // Delete user record
    await db
      .delete(schema.user)
      .where(eq(schema.user.id, targetUserId))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("deleteUserByAdmin error:", error);
    return { error: error?.message || "Failed to delete user account" };
  }
}

/**
 * Server action to update the user's own profile data (name, image, nickname & phoneNumber).
 */
export async function updateUserProfile(
  name: string,
  image: string,
  nickname?: string,
  phoneNumber?: string,
  username?: string,
  email?: string
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const cleanName = name.trim();
    if (!cleanName) {
      return { error: "Name cannot be empty" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const currentUser = await db.select().from(schema.user).where(eq(schema.user.id, session.user.id)).get();
    if (!currentUser) return { error: "User not found" };

    // Validate and check Username if provided
    let cleanUsername = null;
    let isUsernameChanging = false;
    if (username) {
      cleanUsername = username.trim().toLowerCase();
      isUsernameChanging = cleanUsername !== currentUser.username;

      if (!/^[a-z0-9_-]{3,20}$/.test(cleanUsername)) {
        return { error: "Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores." };
      }

      if (isUsernameChanging) {
        // Enforce cooldown
        let cooldownDays = 14;
        if (currentUser.customUsernameCooldown !== null) {
          cooldownDays = currentUser.customUsernameCooldown;
        } else {
          const globalRecord = await db
            .select()
            .from(schema.systemSettings)
            .where(eq(schema.systemSettings.key, "username_cooldown_days"))
            .get();
          if (globalRecord) {
            const parsed = parseInt(globalRecord.value);
            cooldownDays = isNaN(parsed) ? 14 : parsed;
          }
        }

        if (cooldownDays > 0 && currentUser.usernameLastChangedAt) {
          const lastChanged = currentUser.usernameLastChangedAt.getTime();
          const now = Date.now();
          const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
          if (now - lastChanged < cooldownMs) {
            const remainingMs = cooldownMs - (now - lastChanged);
            const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
            const nextAvailable = new Date(lastChanged + cooldownMs).toLocaleDateString();
            return {
              error: `You can only change your username once every ${cooldownDays} days. You can change it again in ${remainingDays} days (around ${nextAvailable}).`,
            };
          }
        }
      }

      // Check if username is already taken by another user
      const existingUserByUsername = await db
        .select()
        .from(schema.user)
        .where(
          and(
            eq(schema.user.username, cleanUsername),
            ne(schema.user.id, session.user.id)
          )
        )
        .get();

      if (existingUserByUsername) {
        return { error: "Username is already taken by another account" };
      }
    }

    // Validate and check Email if provided
    let cleanEmail = null;
    if (email) {
      cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { error: "Please provide a valid email address" };
      }

      // Check if email is already registered under another user account
      const existingUserByEmail = await db
        .select()
        .from(schema.user)
        .where(
          and(
            eq(schema.user.email, cleanEmail),
            ne(schema.user.id, session.user.id)
          )
        )
        .get();

      if (existingUserByEmail) {
        return { error: "Email address is already in use by another account" };
      }
    }

    await db
      .update(schema.user)
      .set({
        name: cleanName,
        image: image || null,
        username: cleanUsername || null,
        ...(isUsernameChanging && { usernameLastChangedAt: new Date() }),
        email: cleanEmail || session.user.email,
        nickname: nickname ? nickname.trim() || null : null,
        phoneNumber: phoneNumber ? phoneNumber.trim() || null : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id))
      .run();

    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserProfile error:", error);
    return { error: error?.message || "Failed to update profile" };
  }
}

/**
 * Server action to get all global system settings.
 * Only callable by administrative super_admins.
 */
export async function getSystemSettings() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const userRole = (session.user as any).role;
    const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
    const isOwner = session.user.email === ownerEmail || userRole === "owner";

    if (!isOwner) {
      return { error: "Unauthorized access: Platform Owner authority required" };
    }
    const db = drizzle(env.DB, { schema });

    await db.run(sql`CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`);

    const rows = await db.select().from(schema.systemSettings).all();
    const settings: Record<string, string> = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });

    return { success: true, settings };
  } catch (error: any) {
    console.error("getSystemSettings error:", error);
    return { error: error?.message || "Failed to retrieve settings" };
  }
}

/**
 * Server action to update global system settings keys.
 * Only callable by the Platform Owner.
 */
export async function updateSystemSettings(settings: Record<string, string>) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const userRole = (session.user as any).role;
    const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
    const isOwner = session.user.email === ownerEmail || userRole === "owner";

    if (!isOwner) {
      return { error: "Access denied: Platform Owner authority required" };
    }

    const db = drizzle(env.DB, { schema });
    await db.run(sql`CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`);

    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(schema.systemSettings)
        .values({ key, value: String(value), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: schema.systemSettings.key,
          set: { value: String(value), updatedAt: new Date() },
        })
        .run();
    }

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateSystemSettings error:", error);
    return { error: error?.message || "Failed to save settings" };
  }
}

/**
 * Server action to purge expired auth sessions.
 * Only callable by the Platform Owner.
 */
export async function clearExpiredSessions() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const userRole = (session.user as any).role;
    const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
    const isOwner = session.user.email === ownerEmail || userRole === "owner";

    if (!isOwner) {
      return { error: "Access denied: Platform Owner authority required" };
    }

    const db = drizzle(env.DB, { schema });
    const now = Date.now();
    
    // Purge expired sessions
    await db.run(sql`DELETE FROM session WHERE expires_at < ${now}`);

    return { success: true };
  } catch (error: any) {
    console.error("clearExpiredSessions error:", error);
    return { error: error?.message || "Failed to clear expired sessions" };
  }
}

/**
 * Server action to execute an optimization VACUUM on the D1 sqlite database.
 * Only callable by the Platform Owner.
 */
export async function vacuumDatabase() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const userRole = (session.user as any).role;
    const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
    const isOwner = session.user.email === ownerEmail || userRole === "owner";

    if (!isOwner) {
      return { error: "Access denied: Platform Owner authority required" };
    }

    const db = drizzle(env.DB, { schema });
    await db.run(sql`VACUUM`);

    return { success: true };
  } catch (error: any) {
    console.error("vacuumDatabase error:", error);
    return { error: error?.message || "Failed to vacuum database" };
  }
}

/**
 * Server action to toggle a project's ban status.
 * Callable by any Super Admin operator.
 */
export async function toggleTenantBan(tenantId: string, isBanned: boolean) {
  try {
    const session = await getSession();
    const userRole = session ? (session.user as any).role : null;
    if (!session || (userRole !== "admin" && userRole !== "owner")) {
      return { error: "Unauthorized access" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    await db
      .update(schema.tenants)
      .set({ isBanned })
      .where(eq(schema.tenants.id, tenantId))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("toggleTenantBan error:", error);
    return { error: error?.message || "Failed to update project ban status" };
  }
}

/**
 * Server action to toggle a user's ban status.
 * Callable by any Super Admin operator (cannot ban self).
 */
export async function toggleUserBan(userId: string, isBanned: boolean) {
  try {
    const session = await getSession();
    const userRole = session ? (session.user as any).role : null;
    if (!session || (userRole !== "admin" && userRole !== "owner")) {
      return { error: "Unauthorized access" };
    }

    if (session.user.id === userId) {
      return { error: "You cannot ban your own operator account." };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    await db
      .update(schema.user)
      .set({ isBanned })
      .where(eq(schema.user.id, userId))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("toggleUserBan error:", error);
    return { error: error?.message || "Failed to update user ban status" };
  }
}

/**
 * Server action to update a project's detailed ban and warning status.
 * Callable by any Super Admin operator.
 */
export async function updateTenantBanAndWarning(
  tenantId: string,
  data: {
    isBanned: boolean;
    banReason: string | null;
    banExpiresAt: Date | null;
    isWarned: boolean;
    warningReason: string | null;
    sendMethod?: "inbox" | "email" | "both";
  }
) {
  try {
    const session = await getSession();
    const userRole = session ? (session.user as any).role : null;
    if (!session || (userRole !== "admin" && userRole !== "owner")) {
      return { error: "Unauthorized access" };
    }
    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const tenant = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).get();
    if (!tenant) return { error: "Project not found" };

    const wasWarned = tenant.isWarned;
    const oldReason = tenant.warningReason;

    const wasBanned = tenant.isBanned;

    await db
      .update(schema.tenants)
      .set({
        isBanned: data.isBanned,
        banReason: data.banReason,
        banExpiresAt: data.banExpiresAt,
        isWarned: data.isWarned,
        warningReason: data.warningReason,
        updatedAt: new Date()
      })
      .where(eq(schema.tenants.id, tenantId))
      .run();

    const sendMethod = data.sendMethod || "both";
    const notifyUser = async (title: string, msg: string) => {
      if (sendMethod === "inbox" || sendMethod === "both") {
        await db.insert(schema.notifications).values({
          userId: tenant.userId,
          title: title,
          message: msg,
        }).run();
      }
      if (sendMethod === "email" || sendMethod === "both") {
        const tenantOwner = await db.select().from(schema.user).where(eq(schema.user.id, tenant.userId)).get();
        if (tenantOwner && tenantOwner.email && process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "admins@mails.jozelio.com",
            to: tenantOwner.email,
            subject: title,
            html: systemNoticeEmail(title, msg),
          });
        }
      }
    };

    if (data.isBanned && !wasBanned) {
      await notifyUser(
        `Project Suspended: ${tenant.businessName}`,
        data.banReason || "Your project storefront has been suspended by administration."
      );
    } else if (data.isWarned && (!wasWarned || oldReason !== data.warningReason)) {
      await notifyUser(
        `Project Warning: ${tenant.businessName}`,
        data.warningReason || "A warning has been placed on your project storefront."
      );
    }

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateTenantBanAndWarning error:", error);
    return { error: error?.message || "Failed to update project settings" };
  }
}

/**
 * Server action to update a user's detailed ban and warning status.
 * Callable by any Super Admin operator (cannot modify self).
 */
export async function updateUserBanAndWarning(
  userId: string,
  data: {
    isBanned: boolean;
    banReason: string | null;
    banExpiresAt: Date | null;
    isWarned: boolean;
    warningReason: string | null;
    sendMethod?: "inbox" | "email" | "both";
    customUsernameCooldown?: number | null;
    usernameCooldownAction?: "enforce" | "clear" | "unchanged";
  }
) {
  try {
    const session = await getSession();
    const userRole = session ? (session.user as any).role : null;
    if (!session || (userRole !== "admin" && userRole !== "owner")) {
      return { error: "Unauthorized access" };
    }

    if (session.user.id === userId) {
      return { error: "You cannot modify your own operator warning/ban status." };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const targetUser = await db.select().from(schema.user).where(eq(schema.user.id, userId)).get();
    if (!targetUser) return { error: "User not found" };

    const wasWarned = targetUser.isWarned;
    const oldReason = targetUser.warningReason;

    const wasBanned = targetUser.isBanned;

    let newUsernameLastChangedAt = targetUser.usernameLastChangedAt;

    if (data.usernameCooldownAction === "enforce") {
      newUsernameLastChangedAt = new Date();
    } else if (data.usernameCooldownAction === "clear") {
      newUsernameLastChangedAt = null;
    }

    await db
      .update(schema.user)
      .set({
        isBanned: data.isBanned,
        banReason: data.banReason,
        banExpiresAt: data.banExpiresAt,
        isWarned: data.isWarned,
        warningReason: data.warningReason,
        customUsernameCooldown: data.customUsernameCooldown !== undefined ? data.customUsernameCooldown : targetUser.customUsernameCooldown,
        ...(data.usernameCooldownAction && data.usernameCooldownAction !== "unchanged" ? { usernameLastChangedAt: newUsernameLastChangedAt } : {}),
        updatedAt: new Date()
      })
      .where(eq(schema.user.id, userId))
      .run();

    const sendMethod = data.sendMethod || "both";
    const notifyTargetUser = async (title: string, msg: string) => {
      if (sendMethod === "inbox" || sendMethod === "both") {
        await db.insert(schema.notifications).values({
          userId: userId,
          title: title,
          message: msg,
        }).run();
      }
      if ((sendMethod === "email" || sendMethod === "both") && targetUser.email && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "admins@mails.jozelio.com",
          to: targetUser.email,
          subject: title,
          html: systemNoticeEmail(title, msg),
        });
      }
    };

    if (data.isBanned && !wasBanned) {
      await notifyTargetUser(
        `Account Suspended`,
        data.banReason || "Your account has been suspended by administration."
      );
    } else if (data.isWarned && (!wasWarned || oldReason !== data.warningReason)) {
      await notifyTargetUser(
        `Account Warning`,
        data.warningReason || "A warning has been placed on your account. Please review platform guidelines."
      );
    }

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserBanAndWarning error:", error);
    return { error: error?.message || "Failed to update user settings" };
  }
}

export async function updateUserMaxProjects(targetUserId: string, newMax: number) {
  try {
    const session = await getSession();
    const userRole = session ? (session.user as any).role : null;
    if (!session || (userRole !== "admin" && userRole !== "owner")) {
      return { error: "Unauthorized access" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });
    
    await db
      .update(schema.user)
      .set({ maxProjects: newMax })
      .where(eq(schema.user.id, targetUserId))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserMaxProjects error:", error);
    return { error: error?.message || "Internal server error" };
  }
}

/**
 * Owner-exclusive Server Action to send a message to a user.
 * Can be sent to the platform Inbox and/or as an Email.
 */
export async function sendMessageByAdmin(
  targetUserId: string,
  subject: string,
  messageBody: string,
  sendToInbox: boolean,
  sendAsEmail: boolean
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    const { env } = getCloudflareContext();
    const ownerEmail = (env as any).OWNER_EMAIL;
    const isOwner = userRole === "owner" || (Boolean(ownerEmail) && session.user.email === ownerEmail);

    // Only owners can send messages
    if (!isOwner) {
      return { error: "Unauthorized: Only Owners can send platform messages." };
    }

    const db = drizzle(env.DB, { schema });
    
    // Get target user info
    const targetUser = await db.select({ email: schema.user.email, name: schema.user.name }).from(schema.user).where(eq(schema.user.id, targetUserId)).get();
    if (!targetUser) return { error: "Target user not found" };

    if (sendToInbox) {
      await db.insert(schema.notifications).values({
        userId: targetUserId,
        title: subject,
        message: messageBody,
      }).run();
    }

    if (sendAsEmail) {
      if (process.env.RESEND_API_KEY) {
        const fromEmail = process.env.RESEND_NEWS_EMAIL || "Jozelio News <news@mail.jozelio.com>";
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: fromEmail,
          to: targetUser.email,
          subject: subject,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #113669; border-radius: 8px;">
            <h2 style="color: #113669; font-weight: 900; text-transform: uppercase;">${subject}</h2>
            <p style="color: #333; line-height: 1.6;">${messageBody.replace(/\n/g, '<br/>')}</p>
            <br/>
            <hr style="border: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">This is an automated message from the Jozelio Platform.</p>
          </div>`
        });
      } else {
        console.warn("Skipping email delivery: RESEND_API_KEY not set");
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("sendMessageByAdmin error:", error);
    return { error: error?.message || "Failed to send message" };
  }
}

/**
 * Owner-exclusive Server Action to send a global message to all users.
 */
export async function sendGlobalMessageByAdmin(
  subject: string,
  messageBody: string,
  sendToInbox: boolean,
  sendAsEmail: boolean
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    const { env } = getCloudflareContext();
    const ownerEmail = (env as any).OWNER_EMAIL;
    const isOwner = userRole === "owner" || (Boolean(ownerEmail) && session.user.email === ownerEmail);

    // Only owners can send global messages
    if (!isOwner) {
      return { error: "Unauthorized: Only Owners can send global messages." };
    }

    const db = drizzle(env.DB, { schema });
    
    // Fetch all users
    const allUsers = await db.select({ id: schema.user.id, email: schema.user.email }).from(schema.user).all();
    if (!allUsers || allUsers.length === 0) return { error: "No users found in database" };

    if (sendToInbox) {
      const inboxPayloads = allUsers.map(u => ({
        userId: u.id,
        title: subject,
        message: messageBody,
      }));
      
      // SQLite/D1 has an insert limit per statement, but for small-medium scale, inserting in chunks is safer
      // We will chunk it by 50 to be safe
      const chunkSize = 50;
      for (let i = 0; i < inboxPayloads.length; i += chunkSize) {
        const chunk = inboxPayloads.slice(i, i + chunkSize);
        await db.insert(schema.notifications).values(chunk).run();
      }
    }

    if (sendAsEmail) {
      if (process.env.RESEND_API_KEY) {
        const fromEmail = process.env.RESEND_NEWS_EMAIL || "Jozelio News <news@mail.jozelio.com>";
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Use batch sending for Resend. Resend supports up to 100 emails per batch.
        const chunkSize = 100;
        for (let i = 0; i < allUsers.length; i += chunkSize) {
          const chunk = allUsers.slice(i, i + chunkSize);
          const emailPayloads = chunk.map(u => ({
            from: fromEmail,
            to: u.email,
            subject: subject,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #113669; border-radius: 8px;">
              <h2 style="color: #113669; font-weight: 900; text-transform: uppercase;">${subject}</h2>
              <p style="color: #333; line-height: 1.6;">${messageBody.replace(/\n/g, '<br/>')}</p>
              <br/>
              <hr style="border: 1px solid #eee;" />
              <p style="color: #666; font-size: 12px;">This is an automated global message from the Jozelio Platform.</p>
            </div>`
          }));
          await resend.batch.send(emailPayloads);
        }
      } else {
        console.warn("Skipping global email delivery: RESEND_API_KEY not set");
      }
    }

    return { success: true, count: allUsers.length };
  } catch (error: any) {
    console.error("sendGlobalMessageByAdmin error:", error);
    return { error: error?.message || "Failed to send global message" };
  }
}

