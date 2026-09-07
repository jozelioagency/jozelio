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
 * Server action to create a Bocado menu item.
 * Enforces tier restrictions: free tier users cannot save more than 3 listings.
 */
export async function createMenuItem(data: {
  tenantId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceEgp: number;
  category: string;
  imageUrl?: string;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Unauthorized" };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const tenant = await checkUserProjectPermission(db, data.tenantId, session.user.id, ["owner", "admin", "manager"]);

    if (!tenant) {
      return { error: "Tenant profile not found or unauthorized role" };
    }

    const existingCountResult = await db
      .select({ val: count() })
      .from(schema.menuItems)
      .where(eq(schema.menuItems.tenantId, tenant.id))
      .get();

    const currentCount = existingCountResult?.val || 0;

    // Fetch custom menu listing thresholds from system_settings
    let limitMax = tenant.customMenuLimit !== null && tenant.customMenuLimit !== undefined
      ? tenant.customMenuLimit
      : (tenant.tier === "free" ? 5 : tenant.tier === "pro" ? 30 : 100);

    if (tenant.customMenuLimit === null || tenant.customMenuLimit === undefined) {
      try {
        const limitKey = `limit_${tenant.tier}_menu_items`;
        const dbSetting = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, limitKey)).get();
        if (dbSetting && !isNaN(parseInt(dbSetting.value))) {
          limitMax = parseInt(dbSetting.value);
        }
      } catch (err) {
        console.error("Failed to read dynamic plan menu limit:", err);
      }
    }

    if (currentCount >= limitMax) {
      return {
        error: `Your ${tenant.tier.toUpperCase()} project storefront is limited to ${limitMax} menu items. Please upgrade to add more items.`,
      };
    }

    const priceInCents = Math.round(data.priceEgp * 100);

    await db.insert(schema.menuItems).values({
      tenantId: tenant.id,
      nameEn: data.nameEn.trim(),
      nameAr: data.nameAr.trim(),
      descriptionEn: data.descriptionEn.trim(),
      descriptionAr: data.descriptionAr.trim(),
      price: priceInCents,
      currency: "EGP",
      category: data.category.trim(),
      imageUrl: data.imageUrl,
      isAvailable: true,
      sortOrder: 0,
    });

    revalidatePath(`/project/${tenant.id}/bocado/menu`);
    return { success: true };
  } catch (error: any) {
    console.error("createMenuItem error:", error);
    return { error: error?.message || "Internal server error" };
  }
}

/**
 * Server action to update a Bocado menu item.
 */
export async function updateMenuItem(
  itemId: string,
  data: {
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    priceEgp: number;
    category: string;
    imageUrl?: string;
  }
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const item = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, itemId))
      .get();
    if (!item) return { error: "Item not found" };

    const tenant = await checkUserProjectPermission(db, item.tenantId, session.user.id, ["owner", "admin", "manager"]);
    if (!tenant) return { error: "Unauthorized role" };

    const priceInCents = Math.round(data.priceEgp * 100);

    await db
      .update(schema.menuItems)
      .set({
        nameEn: data.nameEn.trim(),
        nameAr: data.nameAr.trim(),
        descriptionEn: data.descriptionEn.trim(),
        descriptionAr: data.descriptionAr.trim(),
        price: priceInCents,
        category: data.category.trim(),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.menuItems.id, itemId))
      .run();

    revalidatePath(`/project/${tenant.id}/bocado/menu`);
    return { success: true };
  } catch (error: any) {
    console.error("updateMenuItem error:", error);
    return { error: error?.message || "Internal server error" };
  }
}

/**
 * Server action to toggle menu item availability.
 */
export async function toggleMenuItemAvailability(itemId: string, isAvailable: boolean) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const item = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, itemId))
      .get();
    if (!item) return { error: "Item not found" };

    const tenant = await checkUserProjectPermission(db, item.tenantId, session.user.id, ["owner", "admin", "manager"]);

    if (!tenant) return { error: "Unauthorized role" };

    await db
      .update(schema.menuItems)
      .set({ isAvailable })
      .where(eq(schema.menuItems.id, itemId))
      .run();

    revalidatePath(`/project/${tenant.id}/bocado/menu`);
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Internal server error" };
  }
}

/**
 * Server action to delete a Bocado menu item.
 */
export async function deleteMenuItem(itemId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const item = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, itemId))
      .get();
    if (!item) return { error: "Item not found" };

    const tenant = await checkUserProjectPermission(db, item.tenantId, session.user.id, ["owner", "admin", "manager"]);
    if (!tenant) return { error: "Unauthorized role" };

    await db
      .delete(schema.menuItems)
      .where(eq(schema.menuItems.id, itemId))
      .run();

    revalidatePath(`/project/${tenant.id}/bocado/menu`);
    return { success: true };
  } catch (error: any) {
    console.error("deleteMenuItem error:", error);
    return { error: error?.message || "Internal server error" };
  }
}

