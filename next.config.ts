import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize the Cloudflare dev environment so getCloudflareContext()
// can access D1/R2 bindings during local development via `next dev`.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
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
