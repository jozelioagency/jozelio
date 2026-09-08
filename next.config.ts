import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize the Cloudflare dev environment only during local development (`next dev`)
// so getCloudflareContext() can access D1/R2 bindings without keeping active
// connection handles open during CI/CD production builds.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/((?!storefronts).*)*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // ─── Cloudflare Edge Runtime Guard ───────────────────────
  // Do NOT add serverExternalPackages or Node.js polyfills.
  // All server code runs on Cloudflare Workers via @opennextjs/cloudflare.
  allowedDevOrigins: [
    "jozelio.dev",
    "www.jozelio.dev",
    "gustopizza.jozelio.dev",
    "burgerbox.jozelio.dev",
    "admins.jozelio.dev",
    "pizza.jozelio.dev"
  ],
};

export default nextConfig;
