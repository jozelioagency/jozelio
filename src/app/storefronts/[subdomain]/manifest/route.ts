import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";


export async function GET(
  request: NextRequest,
  props: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await props.params;

    if (!subdomain) {
      return new Response("Subdomain parameter is required", { status: 400 });
    }

    const { env } = getCloudflareContext();
    const db = drizzle(env.DB, { schema });

    // 1. Fetch tenant from database matching subdomain
    const tenant = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.subdomain, subdomain.toLowerCase()))
      .get();

    if (!tenant) {
      return new Response("Tenant not found", { status: 404 });
    }

    const isFree = tenant.tier === "free";

    const name = isFree ? tenant.businessName : (tenant.pwaDisplayName || tenant.businessName);
    const short_name = isFree ? tenant.businessName : (tenant.pwaDisplayName || tenant.businessName);
    const description = isFree ? `Order food directly from ${tenant.businessName}` : (tenant.pwaDescription || `Order food directly from ${tenant.businessName}`);
    const background_color = isFree ? "#eaeaea" : (tenant.themeNeutralColor || "#eaeaea");
    const theme_color = isFree ? "#f58a2d" : (tenant.themePrimaryColor || "#f58a2d");
    const iconUrl = isFree ? null : tenant.iconUrl;

    // 2. Build custom dynamic PWA manifest JSON derived from D1
    const pwaManifest = {
      name,
      short_name,
      description,
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color,
      theme_color,
      icons: iconUrl
        ? [
            {
              src: iconUrl,
              sizes: "192x192 512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ]
        : [
            {
              src: "/branding/mail-logo.png",
              sizes: "192x192 512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
    };

    return NextResponse.json(pwaManifest, {
      headers: {
        "content-type": "application/manifest+json",
        "cache-control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Manifest generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
