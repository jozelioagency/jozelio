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


/**
 * Fetch unread system notifications for the current user
 */
export async function getSystemNotifications() {
  try {
    const session = await getSession();
    if (!session) return [];

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    return await db
      .select({
        id: schema.notifications.id,
        title: schema.notifications.title,
        message: schema.notifications.message,
        createdAt: schema.notifications.createdAt,
      })
      .from(schema.notifications)
      .where(
        sql`${schema.notifications.userId} = ${session.user.id} AND ${schema.notifications.isRead} = 0`
      )
      .orderBy(sql`${schema.notifications.createdAt} DESC`)
      .all();
  } catch (error) {
    console.error("getSystemNotifications error:", error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(sql`${schema.notifications.id} = ${notificationId} AND ${schema.notifications.userId} = ${session.user.id}`)
      .run();

    return { success: true };
  } catch (error: any) {
    console.error("markNotificationAsRead error:", error);
    return { error: "Failed to mark as read" };
  }
}

/**
 * Server action to permanently delete a notification from the inbox.
 */
export async function deleteNotification(id: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const notif = await db.select().from(schema.notifications).where(eq(schema.notifications.id, id)).get();
    
    if (!notif) return { error: "Notification not found" };
    if (notif.userId !== session.user.id) return { error: "Unauthorized access" };

    await db.delete(schema.notifications).where(eq(schema.notifications.id, id)).run();
    revalidatePath("/dashboard");
    revalidatePath("/inbox");

    return { success: true };
  } catch (error: any) {
    console.error("deleteNotification error:", error);
    return { error: error?.message || "Failed to delete notification" };
  }
}

