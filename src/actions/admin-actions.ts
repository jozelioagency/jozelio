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
import { handleActionError, validateLength, MAX_LENGTHS, checkIsOwner, checkIsAdminOrOwner } from "./_shared";
import { getEnv } from "@/lib/get-env";



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

    const isOwner = checkIsOwner(session);

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

    const { env } = getCloudflareContext();
    const isOwner = checkIsOwner(session);
    const isAdminOrOwner = checkIsAdminOrOwner(session);

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
    const isOwner = checkIsOwner(session);

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
    const isOwner = checkIsOwner(session);

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
    const isOwner = checkIsOwner(session);

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
    const isOwner = checkIsOwner(session);

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

    const userRole = (session.user as { role?: string }).role;
    const isOwner = userRole === "owner";

    // Only owners can send messages
    if (!isOwner) {
      return { error: "Unauthorized: Only Owners can send platform messages." };
    }

    // Input length validation
    const subjectErr = validateLength(subject, "Subject", MAX_LENGTHS.notificationTitle);
    if (subjectErr) return subjectErr;
    const bodyErr = validateLength(messageBody, "Message", MAX_LENGTHS.notificationMessage);
    if (bodyErr) return bodyErr;

    const { env } = getCloudflareContext();
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
      const resendApiKey = getEnv("RESEND_API_KEY");
      if (resendApiKey) {
        const fromEmail = getEnv("RESEND_NEWS_EMAIL") || "Jozelio News <news@mail.jozelio.com>";
        const resend = new Resend(resendApiKey);
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

    const userRole = (session.user as { role?: string }).role;
    const isOwner = userRole === "owner";

    // Only owners can send global messages
    if (!isOwner) {
      return { error: "Unauthorized: Only Owners can send global messages." };
    }

    // Input length validation
    const subjectErr = validateLength(subject, "Subject", MAX_LENGTHS.notificationTitle);
    if (subjectErr) return subjectErr;
    const bodyErr = validateLength(messageBody, "Message", MAX_LENGTHS.notificationMessage);
    if (bodyErr) return bodyErr;

    const { env } = getCloudflareContext();
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
      const resendApiKey = getEnv("RESEND_API_KEY");
      if (resendApiKey) {
        const fromEmail = getEnv("RESEND_NEWS_EMAIL") || "Jozelio News <news@mail.jozelio.com>";
        const resend = new Resend(resendApiKey);
        
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

// ─── Enterprise Accounting & Financial Server Actions ─────────────────────────

/**
 * Server action to get accounting and financial summary.
 */
export async function getAccountingSummary() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "owner") {
      return { error: "Unauthorized: Operator access required" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const transactions = await db
      .select()
      .from(schema.accountingTransactions)
      .orderBy(sql`${schema.accountingTransactions.transactionDate} DESC`)
      .all();

    const tenants = await db
      .select({
        id: schema.tenants.id,
        tier: schema.tenants.tier,
        businessName: schema.tenants.businessName,
      })
      .from(schema.tenants)
      .all();

    const tierCounts = {
      free: tenants.filter((t) => t.tier === "free").length,
      pro: tenants.filter((t) => t.tier === "pro").length,
      enterprise: tenants.filter((t) => t.tier === "enterprise").length,
    };

    // Calculate baseline MRR from active subscription tiers
    // Baseline: Pro = 499 EGP, Enterprise = 2499 EGP
    const mrrFromTenants = tierCounts.pro * 499 + tierCounts.enterprise * 2499;

    let totalRevenue = 0;
    let totalExpenses = 0;
    let pendingReceivables = 0;
    const categoryExpenses: Record<string, number> = {};
    const categoryRevenues: Record<string, number> = {};
    const paymentStatusCounts = { paid: 0, pending: 0, refunded: 0, cancelled: 0 };

    transactions.forEach((tx) => {
      paymentStatusCounts[tx.status as keyof typeof paymentStatusCounts] =
        (paymentStatusCounts[tx.status as keyof typeof paymentStatusCounts] || 0) + 1;

      if (tx.status === "paid") {
        if (tx.type === "revenue") {
          totalRevenue += tx.amount;
          categoryRevenues[tx.category] = (categoryRevenues[tx.category] || 0) + tx.amount;
        } else if (tx.type === "expense") {
          totalExpenses += tx.amount;
          categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + tx.amount;
        }
      } else if (tx.status === "pending" && tx.type === "revenue") {
        pendingReceivables += tx.amount;
      }
    });

    const netProfit = totalRevenue - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const effectiveMRR = Math.max(mrrFromTenants, Math.round(totalRevenue / 3) || mrrFromTenants);
    const arr = effectiveMRR * 12;
    const paidTenantsCount = tierCounts.pro + tierCounts.enterprise;
    const arpu = paidTenantsCount > 0 ? Math.round(effectiveMRR / paidTenantsCount) : 0;

    // Monthly historical trends for the last 6 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlyTrends: Array<{
      monthKey: string;
      label: string;
      revenue: number;
      expenses: number;
      net: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const label = `${monthNames[mIdx]} ${yr}`;
      const monthKey = `${yr}-${String(mIdx + 1).padStart(2, "0")}`;

      const monthTxs = transactions.filter((tx) => {
        if (tx.status !== "paid") return false;
        const txDate = new Date(tx.transactionDate);
        return txDate.getFullYear() === yr && txDate.getMonth() === mIdx;
      });

      const rev = monthTxs
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + t.amount, 0);
      const exp = monthTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyTrends.push({
        monthKey,
        label,
        revenue: rev,
        expenses: exp,
        net: rev - exp,
      });
    }

    return {
      success: true,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        netMargin: Math.round(netMargin * 10) / 10,
        pendingReceivables,
        mrr: effectiveMRR,
        arr,
        arpu,
        tierCounts,
        categoryExpenses,
        categoryRevenues,
        paymentStatusCounts,
        monthlyTrends,
        totalTransactions: transactions.length,
      },
      transactions,
    };
  } catch (error: any) {
    console.error("getAccountingSummary error:", error);
    return { error: error?.message || "Failed to load accounting data" };
  }
}

/**
 * Server action to create a new accounting transaction (Revenue or Expense).
 */
export async function createAccountingTransaction(data: {
  type: "revenue" | "expense";
  category: string;
  description: string;
  amount: number;
  currency?: string;
  tenantId?: string | null;
  entityName?: string | null;
  status?: "paid" | "pending" | "refunded" | "cancelled";
  paymentMethod?: string;
  invoiceNumber?: string | null;
  notes?: string | null;
  transactionDate?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "owner") {
      return { error: "Unauthorized: Operator access required" };
    }

    if (!data.description?.trim()) {
      return { error: "Description is required" };
    }
    if (!data.amount || data.amount <= 0) {
      return { error: "Amount must be greater than zero" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const invNum =
      data.invoiceNumber?.trim() ||
      `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const newRecord: schema.NewAccountingTransaction = {
      id: crypto.randomUUID(),
      type: data.type,
      category: data.category.trim().toLowerCase(),
      description: data.description.trim(),
      amount: Math.round(data.amount),
      currency: (data.currency || "EGP").toUpperCase(),
      tenantId: data.tenantId || null,
      entityName: data.entityName?.trim() || null,
      status: data.status || "paid",
      paymentMethod: data.paymentMethod || "other",
      invoiceNumber: invNum,
      notes: data.notes?.trim() || null,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.accountingTransactions).values(newRecord).run();

    revalidatePath("/jozelio-admin");
    return { success: true, transaction: newRecord };
  } catch (error: any) {
    console.error("createAccountingTransaction error:", error);
    return { error: error?.message || "Failed to create accounting transaction" };
  }
}

/**
 * Server action to update an existing accounting transaction.
 */
export async function updateAccountingTransaction(
  id: string,
  data: Partial<schema.NewAccountingTransaction>
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "owner") {
      return { error: "Unauthorized: Operator access required" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    await db
      .update(schema.accountingTransactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.accountingTransactions.id, id))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateAccountingTransaction error:", error);
    return { error: error?.message || "Failed to update accounting transaction" };
  }
}

/**
 * Server action to delete an accounting transaction.
 */
export async function deleteAccountingTransaction(id: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "owner") {
      return { error: "Unauthorized: Operator access required" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    await db
      .delete(schema.accountingTransactions)
      .where(eq(schema.accountingTransactions.id, id))
      .run();

    revalidatePath("/jozelio-admin");
    return { success: true };
  } catch (error: any) {
    console.error("deleteAccountingTransaction error:", error);
    return { error: error?.message || "Failed to delete accounting transaction" };
  }
}

/**
 * Server action to seed baseline accounting data derived from active tenants & cloud services.
 */
export async function seedInitialAccountingData() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "owner") {
      return { error: "Unauthorized: Operator access required" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingTransactions)
      .get();

    if (existingCount && existingCount.count > 0) {
      return { error: "Accounting ledger already contains transactions. Seeding skipped." };
    }

    const tenants = await db
      .select({
        id: schema.tenants.id,
        businessName: schema.tenants.businessName,
        tier: schema.tenants.tier,
      })
      .from(schema.tenants)
      .all();

    const now = new Date();
    const seedRecords: schema.NewAccountingTransaction[] = [];

    // 1. Seed tenant subscriptions for the past 3 months
    tenants.forEach((t, index) => {
      const price = t.tier === "enterprise" ? 2499 : t.tier === "pro" ? 499 : 0;
      if (price > 0) {
        for (let m = 0; m < 3; m++) {
          const txDate = new Date(now.getFullYear(), now.getMonth() - m, 5 + (index % 20));
          seedRecords.push({
            id: crypto.randomUUID(),
            type: "revenue",
            category: "subscription",
            description: `${t.tier.toUpperCase()} Plan Subscription — ${t.businessName}`,
            amount: price,
            currency: "EGP",
            tenantId: t.id,
            entityName: t.businessName,
            status: "paid",
            paymentMethod: index % 2 === 0 ? "instapay" : "card",
            invoiceNumber: `INV-2026-${String(now.getMonth() - m + 1).padStart(2, "0")}${String(index + 101)}`,
            notes: `Auto-generated subscription billing cycle for ${t.businessName}`,
            transactionDate: txDate,
            createdAt: txDate,
            updatedAt: txDate,
          });
        }
      }
    });

    // 2. Seed baseline recurring operational expenses for the past 3 months
    const baseExpenses = [
      { category: "cloudflare", desc: "Cloudflare Workers & D1 Paid Plan", amount: 250, method: "card", vendor: "Cloudflare, Inc." },
      { category: "resend", desc: "Resend Email API Transactional Tier", amount: 180, method: "card", vendor: "Resend Labs" },
      { category: "upstash", desc: "Upstash Serverless Redis Quota", amount: 120, method: "card", vendor: "Upstash, Inc." },
      { category: "ai", desc: "Workers AI Neural Inference Token Usage", amount: 150, method: "card", vendor: "Cloudflare AI" },
      { category: "marketing", desc: "Digital Growth & Ad Campaign", amount: 650, method: "card", vendor: "Meta Ads" },
      { category: "salary", desc: "Engineering & Support Operations", amount: 1500, method: "bank_transfer", vendor: "Internal Payroll" },
    ];

    for (let m = 0; m < 3; m++) {
      baseExpenses.forEach((exp, eIdx) => {
        const txDate = new Date(now.getFullYear(), now.getMonth() - m, 1 + eIdx * 4);
        seedRecords.push({
          id: crypto.randomUUID(),
          type: "expense",
          category: exp.category,
          description: exp.desc,
          amount: exp.amount,
          currency: "EGP",
          tenantId: null,
          entityName: exp.vendor,
          status: "paid",
          paymentMethod: exp.method,
          invoiceNumber: `EXP-${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, "0")}-${100 + eIdx}`,
          notes: `Monthly operational cloud & service overhead`,
          transactionDate: txDate,
          createdAt: txDate,
          updatedAt: txDate,
        });
      });
    }

    // Insert all seed records
    for (const rec of seedRecords) {
      await db.insert(schema.accountingTransactions).values(rec).run();
    }

    revalidatePath("/jozelio-admin");
    return { success: true, count: seedRecords.length };
  } catch (error: any) {
    console.error("seedInitialAccountingData error:", error);
    return { error: error?.message || "Failed to seed accounting data" };
  }
}

/**
 * Owner-exclusive Server Action to export an exhaustive, unredacted JSON backup
 * of the entire platform database (all users, sessions, tenants, menus,
 * analytics, system settings, notifications, and accounting ledger).
 */
export async function exportFullPlatformData() {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const isOwner = checkIsOwner(session);

    if (!isOwner) {
      return { error: "Access Denied: Platform Owner privileges are required to export full platform data." };
    }

    const db = drizzle(env.DB, { schema });

    // 1. Fetch all known schema tables in parallel
    const [
      allUsers,
      allSessions,
      allAccounts,
      allVerifications,
      allTenants,
      allTenantMembers,
      allMenuItems,
      allAnalyticsEvents,
      allSystemSettings,
      allNotifications,
      allAccountingTransactions,
    ] = await Promise.all([
      db.select().from(schema.user).all().catch(e => { console.error("Backup users error:", e); return []; }),
      db.select().from(schema.session).all().catch(e => { console.error("Backup sessions error:", e); return []; }),
      db.select().from(schema.account).all().catch(e => { console.error("Backup accounts error:", e); return []; }),
      db.select().from(schema.verification).all().catch(e => { console.error("Backup verifications error:", e); return []; }),
      db.select().from(schema.tenants).all().catch(e => { console.error("Backup tenants error:", e); return []; }),
      db.select().from(schema.tenantMembers).all().catch(e => { console.error("Backup tenantMembers error:", e); return []; }),
      db.select().from(schema.menuItems).all().catch(e => { console.error("Backup menuItems error:", e); return []; }),
      db.select().from(schema.analyticsEvents).all().catch(e => { console.error("Backup analyticsEvents error:", e); return []; }),
      db.select().from(schema.systemSettings).all().catch(e => { console.error("Backup systemSettings error:", e); return []; }),
      db.select().from(schema.notifications).all().catch(e => { console.error("Backup notifications error:", e); return []; }),
      db.select().from(schema.accountingTransactions).all().catch(e => { console.error("Backup accounting error:", e); return []; }),
    ]);

    // 2. Dynamically inspect sqlite_master for any other tables in Cloudflare D1
    const customTables: Record<string, any[]> = {};
    try {
      const rawTables = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%'"
      ).all<{ name: string }>();

      const knownTableNames = new Set([
        "user",
        "session",
        "account",
        "verification",
        "tenants",
        "tenant_members",
        "menu_items",
        "analytics_events",
        "system_settings",
        "notifications",
        "accounting_transactions",
      ]);

      if (rawTables?.results) {
        for (const row of rawTables.results) {
          if (row.name && !knownTableNames.has(row.name)) {
            try {
              const tableRows = await env.DB.prepare(`SELECT * FROM "${row.name}"`).all();
              customTables[row.name] = tableRows?.results || [];
            } catch (tErr) {
              console.warn(`Could not read dynamically discovered table ${row.name}:`, tErr);
            }
          }
        }
      }
    } catch (discoveryErr) {
      console.warn("Dynamic table discovery warning:", discoveryErr);
    }

    const tableCounts: Record<string, number> = {
      user: allUsers.length,
      session: allSessions.length,
      account: allAccounts.length,
      verification: allVerifications.length,
      tenants: allTenants.length,
      tenantMembers: allTenantMembers.length,
      menuItems: allMenuItems.length,
      analyticsEvents: allAnalyticsEvents.length,
      systemSettings: allSystemSettings.length,
      notifications: allNotifications.length,
      accountingTransactions: allAccountingTransactions.length,
      ...Object.fromEntries(Object.entries(customTables).map(([k, v]) => [k, v.length])),
    };

    const totalRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);

    const rawPayload = {
      meta: {
        platform: "Jozelio SaaS Platform",
        system: "Multi-Tenant Restaurant & Storefront Architecture",
        version: "1.0.0",
        backupType: "full_platform_exhaustive_backup",
        exportTimestamp: new Date().toISOString(),
        exportTimestampUnix: Date.now(),
        databaseEngine: "Cloudflare D1 Distributed SQLite Edge",
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: (session.user as any).role,
        },
        summary: {
          totalTables: Object.keys(tableCounts).length,
          totalRecords,
          tableCounts,
        },
        integrityNotice: "This JSON snapshot contains exhaustive unredacted platform data including user entities, tenant configurations, catalogs, and financial transaction records. Store securely in encrypted cold storage.",
      },
      tables: {
        user: allUsers,
        session: allSessions,
        account: allAccounts,
        verification: allVerifications,
        tenants: allTenants,
        tenantMembers: allTenantMembers,
        menuItems: allMenuItems,
        analyticsEvents: allAnalyticsEvents,
        systemSettings: allSystemSettings,
        notifications: allNotifications,
        accountingTransactions: allAccountingTransactions,
        ...customTables,
      },
    };

    // Ensure clean JSON serialization across Edge boundary
    const serializedBackup = JSON.parse(JSON.stringify(rawPayload));

    return {
      success: true,
      backupData: serializedBackup,
      summary: {
        totalRecords,
        totalTables: Object.keys(tableCounts).length,
        tableCounts,
        exportedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("exportFullPlatformData error:", error);
    return { error: error?.message || "Failed to export platform backup data." };
  }
}

