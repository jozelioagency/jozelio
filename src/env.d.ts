/**
 * Augment the CloudflareEnv interface with our project-specific bindings.
 * These match the bindings declared in wrangler.jsonc.
 */
declare global {
  interface CloudflareEnv {
    /** Cloudflare D1 database binding (defined in wrangler.jsonc) */
    DB: D1Database;
    /** Cloudflare R2 bucket binding (defined in wrangler.jsonc) */
    BUCKET: R2Bucket;
    /** Cloudflare Workers AI binding (defined in wrangler.jsonc) */
    AI: any;
  }
}

export {};
