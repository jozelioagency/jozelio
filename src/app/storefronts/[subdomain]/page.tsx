import { notFound } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";
import * as schema from "@/db/schema";
import BocadoStorefrontClient from "../templates/bocado/BocadoStorefrontClient";
import { ShieldAlert } from "lucide-react";

import { headers } from "next/headers";
import type { Metadata } from "next";

export const runtime = "edge";

export async function generateMetadata(
  props: { params: Promise<{ subdomain: string }> }
): Promise<Metadata> {
  const { subdomain } = await props.params;
  if (!subdomain) return { title: "Storefront — Jozelio" };

  try {
    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });
    const tenant = await db
      .select({
        businessName: schema.tenants.businessName,
        pwaDisplayName: schema.tenants.pwaDisplayName,
        pwaDescription: schema.tenants.pwaDescription,
        logoUrl: schema.tenants.logoUrl,
        iconUrl: schema.tenants.iconUrl,
      })
      .from(schema.tenants)
      .where(eq(schema.tenants.subdomain, subdomain.toLowerCase()))
      .get();

    if (!tenant) return { title: "Storefront Not Found — Jozelio" };

    const name = tenant.pwaDisplayName || tenant.businessName;
    const desc = tenant.pwaDescription || `Browse the digital menu and offerings for ${name}.`;
    const image = tenant.logoUrl || tenant.iconUrl;

    return {
      title: `${name} — Menu & Ordering`,
      description: desc,
      openGraph: {
        title: name,
        description: desc,
        ...(image ? { images: [{ url: image }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: name,
        description: desc,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return { title: "Storefront — Jozelio" };
  }
}

export default async function StorefrontPage(
  props: { 
    params: Promise<{ subdomain: string }>,
    searchParams: Promise<{ source?: string }>
  }
) {
  const { subdomain } = await props.params;

  if (!subdomain) {
    notFound();
  }

  // 1. Fetch tenant details from D1
  const cf = getCloudflareContext();
  const { env, ctx } = cf;
  const db = drizzle(env.DB, { schema });
  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.subdomain, subdomain.toLowerCase()))
    .get();

  // If no tenant matches, trigger standard Next.js 404
  if (!tenant) {
    notFound();
  }

  // Enforce operator bans/suspensions
  const isBanActive = tenant.isBanned && (
    !tenant.banExpiresAt || new Date(tenant.banExpiresAt) > new Date()
  );

  if (isBanActive) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-blue font-sans flex items-center justify-center p-6 text-center">
        <div className="bg-brand-white border-4 border-brand-blue p-8 max-w-md w-full shadow-[8px_8px_0px_#113669]">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-display font-black text-xl text-brand-blue uppercase tracking-wider mb-2">Storefront Suspended</h1>
          <p className="text-xs font-semibold text-brand-blue/70 leading-relaxed mb-4">
            This storefront directory has been deactivated or suspended by the platform administrator.
          </p>

          <div className="bg-rose-50 border-2 border-rose-500 p-4 text-left">
            <div className="font-mono text-[9px] font-black uppercase text-rose-600 tracking-wider mb-1">
              Reason:
            </div>
            <div className="text-xs text-rose-950 font-bold">
              {tenant.banReason || "No reason specified."}
            </div>
            {tenant.banExpiresAt && (
              <div className="mt-3 pt-2 border-t border-rose-500/20 text-[10px] text-rose-800 font-mono font-bold uppercase">
                Expected Lift: {new Date(tenant.banExpiresAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Asynchronously log unique analytics event
  const resolvedSearchParams = await props.searchParams;
  const eventType = resolvedSearchParams?.source === "qr" ? "qr_scan" : "view";
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const referrer = headersList.get("referer") || "";
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const deviceType = isMobile ? "mobile" : "desktop";

  // Build a privacy-safe daily unique visitor hash: SHA-256(tenantId + IP + YYYY-MM-DD)
  // This means the same visitor refreshing the page only counts once per day.
  const visitorIp =
    headersList.get("cf-connecting-ip") ||
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const hashInput = new TextEncoder().encode(`${tenant.id}:${visitorIp}:${today}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", hashInput);
  const visitorHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Only insert if this visitor has not been counted today
  const logAnalyticsPromise = (async () => {
    try {
      const existing = await db
        .select({ id: schema.analyticsEvents.id })
        .from(schema.analyticsEvents)
        .where(eq(schema.analyticsEvents.visitorHash, visitorHash))
        .get();

      if (!existing) {
        await db.insert(schema.analyticsEvents).values({
          tenantId: tenant.id,
          eventType,
          deviceType,
          referrer: referrer || null,
          visitorHash,
        }).run();
      }
    } catch (err) {
      console.error("Failed to log analytics event:", err);
    }
  })();

  if (ctx?.waitUntil) {
    ctx.waitUntil(logAnalyticsPromise);
  }



  // 2. Fetch all menu items for this tenant
  // SECURE QUERY: Bounded directly across matching tenantId
  const items = await db
    .select()
    .from(schema.menuItems)
    .where(
      and(
        eq(schema.menuItems.tenantId, tenant.id),
        eq(schema.menuItems.isAvailable, true)
      )
    )
    .all();

  // Enforce tier plan limits if the user downgraded
  let displayItems = items;
  if (tenant.tier === "free") {
    displayItems = items.slice(0, 5);
  } else if (tenant.tier === "pro") {
    displayItems = items.slice(0, 30);
  } else if (tenant.tier === "enterprise") {
    displayItems = items.slice(0, 100);
  }

  // Downgrade protection overrides
  const isFree = tenant.tier === "free";
  const themePrimaryColor = isFree ? "#f58a2d" : (tenant.themePrimaryColor || "#f58a2d");
  const themeSecondaryColor = isFree ? "#113669" : (tenant.themeSecondaryColor || "#113669");
  const themeNeutralColor = isFree ? "#eaeaea" : (tenant.themeNeutralColor || "#eaeaea");
  const instagramUrl = isFree ? null : tenant.instagramUrl;
  const facebookUrl = isFree ? null : tenant.facebookUrl;
  const tiktokUrl = isFree ? null : tenant.tiktokUrl;
  const twitterUrl = isFree ? null : tenant.twitterUrl;
  const whatsapp = isFree ? null : tenant.whatsapp;
  const telegram = isFree ? null : tenant.telegram;
  const hideBranding = isFree ? false : tenant.hideBranding;
  const showLocations = tenant.showLocations ?? true;
  const location = tenant.location;
  const googleMapsLink = tenant.googleMapsLink;
  const hasBranches = tenant.hasBranches;
  const branchesJson = tenant.branchesJson;
  let advancedColors: any = {};
  if (!isFree) {
    try {
      advancedColors = tenant.advancedColorsJson ? JSON.parse(tenant.advancedColorsJson) : {};
    } catch (e) {}
  }

  // Helper to normalize language directions
  const getLangDir = (langName: string, configuredDir: "ltr" | "rtl"): "ltr" | "rtl" => {
    const rtlLangs = ["arabic", "hebrew", "persian", "farsi", "urdu", "yiddish", "syriac", "dhivehi", "العربية", "فارسی", "اردو", "עברית"];
    if (rtlLangs.includes(langName.toLowerCase())) {
      return "rtl";
    }
    const ltrLangs = ["polish", "english", "french", "german", "spanish", "italian", "portuguese", "russian", "chinese", "japanese", "korean", "polski", "pl"];
    if (ltrLangs.includes(langName.toLowerCase())) {
      return "ltr";
    }
    return configuredDir;
  };

  // Load configured secondary languages
  let secondaryLanguages: Array<{ name: string; dir: "rtl" | "ltr" }> = [];
  try {
    const parsed = tenant.languagesJson ? JSON.parse(tenant.languagesJson) : [];
    secondaryLanguages = parsed.map((l: any) => ({
      name: l.name,
      dir: getLangDir(l.name, l.dir)
    }));
  } catch {
    // ignore
  }

  // Enforce tier limits / downgrade protection on languages
  if (tenant.tier === "free") {
    secondaryLanguages = secondaryLanguages.slice(0, 1);
  } else if (tenant.tier === "pro") {
    secondaryLanguages = secondaryLanguages.slice(0, 50);
  }

  return (
    <BocadoStorefrontClient
      subdomain={tenant.subdomain}
      businessName={tenant.businessName}
      menuItems={displayItems}
      themePrimaryColor={themePrimaryColor}
      themeSecondaryColor={themeSecondaryColor}
      themeNeutralColor={themeNeutralColor}
      instagramUrl={instagramUrl}
      facebookUrl={facebookUrl}
      tiktokUrl={tiktokUrl}
      twitterUrl={twitterUrl}
      whatsapp={whatsapp}
      telegram={telegram}
      languages={secondaryLanguages}
      hideBranding={hideBranding}
      showLocations={showLocations}
      location={location}
      googleMapsLink={googleMapsLink}
      hasBranches={hasBranches}
      branchesJson={branchesJson}
      advancedColors={advancedColors}
    />
  );
}
