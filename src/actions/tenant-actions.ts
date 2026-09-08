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
import { handleActionError, validateLength, MAX_LENGTHS } from "./_shared";
import { getEnv } from "@/lib/get-env";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";



const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "jozelio.dev";
const RESERVED_SUBDOMAINS = ["www", "api", "admin", "jozelio", "portal", "media", "auth", "static", "assets"];


/**
 * Shared Helper to validate a user's role-based access to a specific tenant/project
 */
export async function checkUserProjectPermission(
  db: any,
  tenantId: string,
  userId: string,
  allowedRoles: ("owner" | "admin" | "manager" | "viewer")[]
) {
  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .get();

  if (!tenant) return null;

  // Owner always gets full permissions
  if (tenant.userId === userId) {
    if (allowedRoles.includes("owner")) return tenant;
    return null;
  }

  // Check role in tenantMembers
  const member = await db
    .select()
    .from(schema.tenantMembers)
    .where(
      and(
        eq(schema.tenantMembers.tenantId, tenantId),
        eq(schema.tenantMembers.userId, userId),
        eq(schema.tenantMembers.status, "accepted")
      )
    )
    .get();

  if (member && allowedRoles.includes(member.role)) {
    return tenant;
  }

  return null;
}

/**
 * Server action to activate the Bocado restaurant engine for the user.
 */
export async function activateBocado(formData: Record<string, string>) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "You must be logged in to activate a product." };
    }

    const { businessName, subdomain } = formData;
    if (!businessName || !subdomain) {
      return { error: "Business name and subdomain prefix are required." };
    }

    const cleanSubdomain = subdomain.trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(cleanSubdomain)) {
      return { error: "Subdomain must contain only lowercase letters, numbers, and hyphens" };
    }

    if (RESERVED_SUBDOMAINS.includes(cleanSubdomain)) {
      return { error: "This subdomain is reserved. Please choose another one." };
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // 1. Check account project limit
    const userRecord = await db
      .select({ maxProjects: schema.user.maxProjects })
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .get();

    const maxProjects = userRecord?.maxProjects ?? 20;

    const userProjectsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.tenants)
      .where(eq(schema.tenants.userId, session.user.id))
      .get();

    if ((userProjectsCount?.count ?? 0) >= maxProjects) {
      return { error: "You have reached your project limit. Please contact us if you need more projects." };
    }

    // 2. Check if subdomain is unique
    const existingSubdomain = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.subdomain, cleanSubdomain))
      .get();

    if (existingSubdomain) {
      return { error: "This subdomain is already registered. Please choose another one." };
    }

    const newTenantId = crypto.randomUUID();

    // 2. Insert tenant record
    await db.insert(schema.tenants).values({
      id: newTenantId,
      userId: session.user.id,
      subdomain: cleanSubdomain,
      businessName: businessName.trim(),
      verticalType: "bocado_restaurant",
      tier: "free",
      themePrimaryColor: "#f58a2d",
      themeSecondaryColor: "#113669",
      themeNeutralColor: "#eaeaea",
    });

    revalidatePath("/dashboard");

    return { success: true, tenantId: newTenantId };
  } catch (error: any) {
    console.error("activateBocado action error:", error);
    return { error: error?.message || "Internal server error during activation" };
  }
}

/**
 * Server action to update a tenant's subscription tier.
 * Only callable by admin or owner role.
 */
export async function updateTenantTier(
  tenantId: string,
  tier: "free" | "pro" | "enterprise"
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const userRole = (session.user as any).role;
    const isSuperAdmin = userRole === "admin" || userRole === "owner";
    if (!isSuperAdmin) {
      return { error: "Unauthorized: Only platform administrators can change subscription tiers." };
    }

    await db
      .update(schema.tenants)
      .set({ tier, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId))
      .run();

    revalidatePath("/jozelio-admin");
    revalidatePath(`/project/${tenantId}/bocado/plans`);
    return { success: true };
  } catch (error: any) {
    console.error("updateTenantTier error:", error);
    return { error: error?.message || "Failed to update tenant tier" };
  }
}

/**
 * Server action to update custom rate limits and limits for a specific tenant.
 * Only callable by admin or owner role.
 */
export async function updateTenantLimits(
  tenantId: string,
  data: {
    tier: "free" | "pro" | "enterprise";
    isBanned: boolean;
    customMenuLimit: number | null;
    customLocationLimit: number | null;
    customRateLimit: number | null;
    customSubdomainCooldown: number | null;
    subdomainCooldownAction?: "enforce" | "clear" | "unchanged";
    ownerId?: string;
    ownerMaxProjects?: number;
  }
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const userRole = (session.user as any).role;
    const isSuperAdmin = userRole === "admin" || userRole === "owner";
    if (!isSuperAdmin) {
      return { error: "Unauthorized" };
    }

    const updatePayload: any = {
      tier: data.tier,
      isBanned: data.isBanned,
      customMenuLimit: data.customMenuLimit,
      customLocationLimit: data.customLocationLimit,
      customRateLimit: data.customRateLimit,
      customSubdomainCooldown: data.customSubdomainCooldown,
      updatedAt: new Date(),
    };

    if (data.subdomainCooldownAction === "enforce") {
      updatePayload.subdomainLastChangedAt = new Date();
    } else if (data.subdomainCooldownAction === "clear") {
      updatePayload.subdomainLastChangedAt = null;
    }

    await db
      .update(schema.tenants)
      .set(updatePayload)
      .where(eq(schema.tenants.id, tenantId))
      .run();

    if (data.ownerId && data.ownerMaxProjects !== undefined) {
      await db
        .update(schema.user)
        .set({
          maxProjects: data.ownerMaxProjects,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, data.ownerId))
        .run();
    }

    revalidatePath("/jozelio-admin");
    revalidatePath(`/project/${tenantId}/bocado/plans`);
    revalidatePath(`/project/${tenantId}/bocado/menu`);
    revalidatePath(`/project/${tenantId}/bocado/branding`);
    return { success: true };
  } catch (error: any) {
    console.error("updateTenantLimits error:", error);
    return { error: error?.message || "Failed to update tenant limits" };
  }
}

/**
 * Server action to update brand profile settings.
 */
export async function updateTenantProfile(data: {
  tenantId: string;
  businessName: string;
  subdomain: string;
  logoUrl?: string;
  location?: string;
  googleMapsLink?: string;
  hasBranches?: boolean;
  branchesJson?: string;
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  themeNeutralColor?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  whatsapp?: string;
  telegram?: string;
  iconUrl?: string;
  pwaDisplayName?: string;
  pwaDescription?: string;
  customDomain?: string;
  hideBranding?: boolean;
  advancedColorsJson?: string;
  showLocations?: boolean;
}) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const tenant = await checkUserProjectPermission(db, data.tenantId, session.user.id, ["owner", "admin"]);
    if (!tenant) {
      return { error: "Unauthorized to edit settings" };
    }
    if (data.customDomain && tenant.tier === "free") {
      return { error: "Custom domain mapping is only available on Pro or Enterprise plans." };
    }

    const oldCustomDomain = tenant.customDomain;
    const newCustomDomain = data.customDomain ? data.customDomain.trim().toLowerCase() : null;

    if (newCustomDomain) {
      // Validate domain hostname format (RFC 1123)
      const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
      if (!domainRegex.test(newCustomDomain)) {
        return { error: "Invalid custom domain format. Example: menu.myrestaurant.com" };
      }

      if (newCustomDomain === ROOT_DOMAIN || newCustomDomain.endsWith("." + ROOT_DOMAIN)) {
        return { error: "Cannot use platform root domain or subdomains as a custom domain." };
      }

      // Check collision with other tenants
      const existingDomain = await db
        .select({ id: schema.tenants.id })
        .from(schema.tenants)
        .where(
          and(
            eq(schema.tenants.customDomain, newCustomDomain),
            ne(schema.tenants.id, data.tenantId)
          )
        )
        .get();

      if (existingDomain) {
        return { error: "This custom domain is already registered to another project." };
      }
    }

    let logoUrl = data.logoUrl || null;
    let themePrimaryColor = data.themePrimaryColor || "#f58a2d";
    let themeSecondaryColor = data.themeSecondaryColor || "#113669";
    let themeNeutralColor = data.themeNeutralColor || "#eaeaea";
    let location = data.location || null;
    const googleMapsLink = data.googleMapsLink ? data.googleMapsLink.trim() : null;
    const hasBranches = data.hasBranches || false;
    let branchesJson = data.branchesJson || "[]";
    
    try {
      const parsedBranches = JSON.parse(branchesJson);
      const limitRecord = await db
        .select({ value: schema.systemSettings.value })
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, "location_limit"))
        .get();
      const locationLimit = limitRecord ? parseInt(limitRecord.value) : 30;
      const baseLimit = isNaN(locationLimit) ? 30 : locationLimit;
      const finalLimit = tenant.customLocationLimit !== null && tenant.customLocationLimit !== undefined
        ? tenant.customLocationLimit
        : baseLimit;

      if (Array.isArray(parsedBranches) && parsedBranches.length > finalLimit) {
        return { error: `You can only add up to ${finalLimit} branches.` };
      }
    } catch (e) {
      branchesJson = "[]";
    }

    let instagramUrl = data.instagramUrl ? data.instagramUrl.trim() : null;
    let facebookUrl = data.facebookUrl ? data.facebookUrl.trim() : null;
    let tiktokUrl = data.tiktokUrl ? data.tiktokUrl.trim() : null;
    let twitterUrl = data.twitterUrl ? data.twitterUrl.trim() : null;
    let whatsapp = data.whatsapp ? data.whatsapp.trim() : null;
    let telegram = data.telegram ? data.telegram.trim() : null;
    let iconUrl = data.iconUrl || null;
    let pwaDisplayName = data.pwaDisplayName ? data.pwaDisplayName.trim() : null;
    let pwaDescription = data.pwaDescription ? data.pwaDescription.trim() : null;
    let hideBranding = data.hideBranding || false;
    let advancedColorsJson = data.advancedColorsJson || "{}";

    if (tenant.tier === "free") {
      hideBranding = false;
      advancedColorsJson = "{}";
      logoUrl = null;
      themePrimaryColor = "#f58a2d";
      themeSecondaryColor = "#113669";
      themeNeutralColor = "#eaeaea";
      location = null;
      instagramUrl = null;
      facebookUrl = null;
      tiktokUrl = null;
      twitterUrl = null;
      whatsapp = null;
      telegram = null;
      iconUrl = null;
      pwaDisplayName = null;
      pwaDescription = null;
    }

    let subdomain = tenant.subdomain;
    let subdomainLastChangedAt = tenant.subdomainLastChangedAt;

    const requestedSubdomain = data.subdomain.trim().toLowerCase();
    if (requestedSubdomain !== tenant.subdomain) {
      if (!/^[a-z0-9-]+$/.test(requestedSubdomain)) {
        return { error: "Subdomain must contain only lowercase letters, numbers, and hyphens" };
      }
      if (RESERVED_SUBDOMAINS.includes(requestedSubdomain)) {
        return { error: "This subdomain prefix is reserved. Please choose another one." };
      }

      // Check if it's in use
      const existing = await db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.subdomain, requestedSubdomain))
        .get();
      if (existing) {
        return { error: "This subdomain prefix is already registered. Please choose another one." };
      }

      // Check cooldown
      const cooldownRecord = await db
        .select({ value: schema.systemSettings.value })
        .from(schema.systemSettings)
        .where(eq(schema.systemSettings.key, "subdomain_cooldown_days"))
        .get();
      
      const cooldownDays = cooldownRecord ? parseInt(cooldownRecord.value) : 14;
      
      if (cooldownDays > 0 && tenant.subdomainLastChangedAt) {
        const lastChanged = new Date(tenant.subdomainLastChangedAt).getTime();
        const now = Date.now();
        const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
        if (now - lastChanged < cooldownMs) {
          const remainingMs = cooldownMs - (now - lastChanged);
          const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
          const nextAvailable = new Date(lastChanged + cooldownMs).toLocaleDateString();
          return {
            error: `You can only change your subdomain once every ${cooldownDays} days. You can change it again in ${remainingDays} days (around ${nextAvailable}).`,
          };
        }
      }

      subdomain = requestedSubdomain;
      subdomainLastChangedAt = new Date();
    }

    // Update
    await db
      .update(schema.tenants)
      .set({
        businessName: data.businessName.trim(),
        subdomain,
        subdomainLastChangedAt,
        hideBranding,
        logoUrl,
        location,
        googleMapsLink,
        hasBranches,
        showLocations: data.showLocations ?? true,
        branchesJson,
        themePrimaryColor,
        themeSecondaryColor,
        themeNeutralColor,
        instagramUrl,
        facebookUrl,
        tiktokUrl,
        twitterUrl,
        whatsapp,
        telegram,
        iconUrl,
        pwaDisplayName,
        pwaDescription,
        customDomain: newCustomDomain,
        advancedColorsJson,
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, data.tenantId))
      .run();

    if (newCustomDomain !== oldCustomDomain) {
      // Invalidate Redis cache for immediate propagation
      const redisUrl = getEnv("UPSTASH_REDIS_REST_URL");
      const redisToken = getEnv("UPSTASH_REDIS_REST_TOKEN");
      if (redisUrl && redisToken) {
        try {
          const redis = new Redis({ url: redisUrl, token: redisToken });
          if (oldCustomDomain) await redis.del(`customdomain:${oldCustomDomain}`);
          if (newCustomDomain) await redis.del(`customdomain:${newCustomDomain}`);
        } catch {}
      }

      const zoneId = getEnv("CLOUDFLARE_ZONE_ID");
      const apiToken = getEnv("CLOUDFLARE_API_TOKEN");

      if (zoneId && apiToken) {
        // Delete old custom domain custom hostname from Cloudflare if it was set
        if (oldCustomDomain) {
          try {
            const searchUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames?hostname=${oldCustomDomain}`;
            const searchRes = await fetch(searchUrl, {
              headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
              }
            });
            const searchData = await searchRes.json() as any;
            if (searchData?.success && searchData?.result && searchData.result.length > 0) {
              const hostnameId = searchData.result[0].id;
              const deleteUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${hostnameId}`;
              const deleteRes = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${apiToken}`,
                  "Content-Type": "application/json"
                }
              });
              const deleteData = await deleteRes.json() as any;
              if (!deleteData?.success) {
                console.error(`Failed to delete custom hostname ${oldCustomDomain} from Cloudflare:`, deleteData?.errors);
              }
            }
          } catch (err) {
            console.error(`Error deleting custom hostname ${oldCustomDomain} from Cloudflare:`, err);
          }
        }

        // Add new custom domain custom hostname to Cloudflare
        if (newCustomDomain) {
          try {
            const createUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`;
            const createRes = await fetch(createUrl, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                hostname: newCustomDomain,
                ssl: {
                  method: "http",
                  type: "dv"
                }
              })
            });
            const createData = await createRes.json() as any;
            if (!createData?.success) {
              console.error(`Failed to create custom hostname ${newCustomDomain} on Cloudflare:`, createData?.errors || createData);
            }
          } catch (err) {
            console.error(`Error creating custom hostname ${newCustomDomain} on Cloudflare:`, err);
          }
        }
      } else {
        console.warn("Cloudflare zoneId or apiToken credentials are not set. Skipping SSL provisioning.");
      }
    }

    revalidatePath(`/project/${data.tenantId}/bocado/branding`);
    revalidatePath(`/project/${data.tenantId}/bocado/menu`);
    return { success: true };
  } catch (error: any) {
    return handleActionError(error, "Failed to update brand profile");
  }
}

/**
 * Server action to update configured secondary languages for a tenant.
 * Enforces tier restrictions: free tier allows 1 language max, pro allows 50.
 */
export async function updateTenantLanguages(
  tenantId: string,
  languages: Array<{ name: string; dir: "rtl" | "ltr" }>
) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    const tenant = await checkUserProjectPermission(db, tenantId, session.user.id, ["owner", "admin"]);
    if (!tenant) return { error: "Unauthorized role" };

    // Enforce tier limits
    const finalLanguages = languages;
    if (tenant.tier === "free") {
      if (languages.length > 1) {
        return { error: "Free tier is limited to 1 secondary language. Please upgrade to Pro to add more." };
      }
    } else if (tenant.tier === "pro") {
      if (languages.length > 50) {
        return { error: "Pro tier is limited to 50 secondary languages." };
      }
    }

    await db
      .update(schema.tenants)
      .set({
        languagesJson: JSON.stringify(finalLanguages),
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, tenantId))
      .run();

    revalidatePath(`/project/${tenantId}/bocado/menu`);
    return { success: true };
  } catch (error: any) {
    console.error("updateTenantLanguages error:", error);
    return { error: error?.message || "Failed to update project languages" };
  }
}

/**
 * Server action to translate English text into a target secondary language.
 * Uses Cloudflare Workers AI model @cf/meta/llama-3.1-8b-instruct-fp8 for high-quality menu translation.
 */
export async function translateText(text: string, targetLang: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const trimmed = text.trim();
    if (!trimmed) return { error: "Text is empty" };

    const { env } = getCloudflareContext();
    if (!env.AI) {
      return { error: "Workers AI is not enabled or bound in this environment." };
    }

    // Rate limit check for AI translation requests
    let url = process.env.UPSTASH_REDIS_REST_URL;
    let token = process.env.UPSTASH_REDIS_REST_TOKEN;
    try {
      if (env) {
        url = url || (env as any).UPSTASH_REDIS_REST_URL;
        token = token || (env as any).UPSTASH_REDIS_REST_TOKEN;
      }
    } catch {}

    if (url && token) {
      try {
        const redis = new Redis({ url, token });
        const translationLimiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, "10 s"), // Max 5 translation requests per 10 seconds
          analytics: true,
          prefix: "jozelio_translation_ratelimit",
        });
        const clientHeaders = await headers();
        const ip = clientHeaders.get("cf-connecting-ip") ?? 
                   clientHeaders.get("x-forwarded-for")?.split(",")[0] ?? 
                   clientHeaders.get("x-real-ip") ?? 
                   "127.0.0.1";
        const rateKey = `translate:${session.user.id}:${ip}`;
        const { success } = await translationLimiter.limit(rateKey);
        if (!success) {
          return { error: "Translation limit exceeded. Please wait a moment before trying again." };
        }
      } catch (err) {
        console.error("AI translation rate limit check failed:", err);
      }
    }

    const targetLower = targetLang.trim().toLowerCase();
    let examplesPart = "";
    if (targetLower.includes("arab") || targetLower === "ar") {
      examplesPart = ' (for example, "pizza" translates to "بيتزا", "pepperoni" to "ببروني", "meat" to "لحم", "chicken" to "دجاج")';
    }

    const prompt = `You are a professional multilingual translator specialized in food and restaurant menus.
Translate the following English menu item name or description into natural, high-quality, standard ${targetLang}.${examplesPart}
Keep universal culinary loanwords like "pizza", "burger", "pasta", "pepperoni" in their standard local spelling (for example, in Polish "pizza" is "pizza" and "pepperoni" is "pepperoni").
Do NOT explain the translation. Do NOT add any extra text or notes. Output ONLY the translated text.

English Text: "${trimmed}"
Translation:`;

    // Call Cloudflare Workers AI model
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      messages: [
        { role: "system", content: "You are a professional restaurant menu translation engine." },
        { role: "user", content: prompt }
      ]
    });

    const translatedText = result?.response || "";
    const cleanedText = translatedText.trim().replace(/^["']|["']$/g, "");

    if (cleanedText) {
      return { success: true, translatedText: cleanedText };
    }

    return { error: "Translation failed: Empty response from AI model" };
  } catch (error: any) {
    console.error("translateText error:", error);
    return { error: error?.message || "Failed to translate text" };
  }
}

/**
 * Server action to transfer project ownership to another user.
 */
export async function transferProject(tenantId: string, emailOrUsername: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // 1. Verify the current user is the owner of the tenant
    const tenant = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .get();

    if (!tenant) {
      return { error: "Project not found" };
    }

    if (tenant.userId !== session.user.id) {
      return { error: "Only the primary owner can transfer project ownership" };
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();
    if (!cleanInput) {
      return { error: "Recipient identifier cannot be empty" };
    }

    // 2. Resolve recipient user
    let targetUser = null;
    if (cleanInput.includes("@")) {
      targetUser = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, cleanInput))
        .get();
    } else {
      targetUser = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.username, cleanInput))
        .get();
    }

    if (!targetUser) {
      return { error: `No user found with identifier "${emailOrUsername}"` };
    }

    if (targetUser.id === session.user.id) {
      return { error: "You are already the owner of this project" };
    }

    // 3. Perform transfer:
    // a. Update tenants table owner to the target user ID
    await db
      .update(schema.tenants)
      .set({ userId: targetUser.id })
      .where(eq(schema.tenants.id, tenantId))
      .run();

    // b. Delete target user from membership (since they are now owner)
    await db
      .delete(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.tenantId, tenantId),
          eq(schema.tenantMembers.userId, targetUser.id)
        )
      )
      .run();

    // c. Make old owner an admin member so they don't lose workspace access
    // Remove if they had a member row somehow (e.g. pending invite)
    await db
      .delete(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.tenantId, tenantId),
          eq(schema.tenantMembers.userId, session.user.id)
        )
      )
      .run();

    await db.insert(schema.tenantMembers).values({
      tenantId: tenantId,
      userId: session.user.id,
      email: session.user.email,
      role: "admin",
      status: "accepted",
    });

    revalidatePath("/dashboard");
    revalidatePath(`/project/${tenantId}/bocado/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("transferProject error:", error);
    return { error: error?.message || "Failed to transfer project ownership" };
  }
}

/**
 * Server action to permanently delete a project.
 */
export async function deleteProject(tenantId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // 1. Verify the current user is the owner of the tenant
    const tenant = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .get();

    if (!tenant) {
      return { error: "Project not found" };
    }

    if (tenant.userId !== session.user.id) {
      return { error: "Only the primary owner can delete this project" };
    }

    // Clean up R2 storage assets for this project
    if (env.BUCKET) {
      try {
        const menuImages = await db
          .select({ imageUrl: schema.menuItems.imageUrl })
          .from(schema.menuItems)
          .where(eq(schema.menuItems.tenantId, tenantId))
          .all();

        for (const item of menuImages) {
          if (item.imageUrl) {
            const key = item.imageUrl.includes("/api/media/")
              ? item.imageUrl.split("/api/media/")[1]
              : item.imageUrl.split("/").pop();
            if (key) await env.BUCKET.delete(key).catch(() => {});
          }
        }

        if (tenant.logoUrl) {
          const key = tenant.logoUrl.includes("/api/media/")
            ? tenant.logoUrl.split("/api/media/")[1]
            : tenant.logoUrl.split("/").pop();
          if (key) await env.BUCKET.delete(key).catch(() => {});
        }

        if (tenant.iconUrl) {
          const key = tenant.iconUrl.includes("/api/media/")
            ? tenant.iconUrl.split("/api/media/")[1]
            : tenant.iconUrl.split("/").pop();
          if (key) await env.BUCKET.delete(key).catch(() => {});
        }
      } catch (r2Err) {
        console.warn("Failed to clean up R2 objects for project:", r2Err);
      }
    }

    // 2. Delete tenant (cascade deletes will clear all tables)
    await db
      .delete(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .run();

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("deleteProject error:", error);
    return { error: error?.message || "Failed to delete project" };
  }
}

