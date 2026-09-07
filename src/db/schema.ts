import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";

// ═══════════════════════════════════════════════════════════════════
// Better-Auth Required Tables
// ═══════════════════════════════════════════════════════════════════

/**
 * Users table — extends Better-Auth's base user with a `role` enum.
 * Roles: 'user' (default tenant owner) | 'admin' (platform operator) | 'owner' (platform owner)
 */
export const user = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  username: text("username").unique(),
  nickname: text("nickname"),
  phoneNumber: text("phone_number"),
  role: text("role", { enum: ["user", "admin", "owner"] })
    .notNull()
    .default("user"),
  isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
  banReason: text("ban_reason"),
  banExpiresAt: integer("ban_expires_at", { mode: "timestamp" }),
  isWarned: integer("is_warned", { mode: "boolean" }).notNull().default(false),
  warningReason: text("warning_reason"),
  country: text("country"),
  maxProjects: integer("max_projects").notNull().default(20),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  usernameLastChangedAt: integer("username_last_changed_at", { mode: "timestamp" }),
  customUsernameCooldown: integer("custom_username_cooldown"),
});

/**
 * Sessions table — Better-Auth session management.
 */
export const session = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Accounts table — Better-Auth linked OAuth/credential accounts.
 */
export const account = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Verification table — Better-Auth email/token verification records.
 */
export const verification = sqliteTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════════════
// Business Domain Tables
// ═══════════════════════════════════════════════════════════════════

/**
 * Tenants table — links users to unique subdomains with theme and PWA config.
 * Each tenant represents a business (restaurant, store, etc.) on the platform.
 */
export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subdomain: text("subdomain").notNull().unique(),
    businessName: text("business_name").notNull(),
    /** Vertical type determines which dashboard features are available */
    verticalType: text("vertical_type", {
      enum: ["bocado_restaurant"],
    })
      .notNull()
      .default("bocado_restaurant"),
    /** Subscription tier enforces feature limits */
    tier: text("tier", { enum: ["free", "pro", "enterprise"] })
      .notNull()
      .default("free"),
    isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
    banReason: text("ban_reason"),
    banExpiresAt: integer("ban_expires_at", { mode: "timestamp" }),
    isWarned: integer("is_warned", { mode: "boolean" }).notNull().default(false),
    warningReason: text("warning_reason"),

    // ─── Theme Configuration ──────────────────────────────
    themePrimaryColor: text("theme_primary_color").notNull().default("#f58a2d"),
    themeSecondaryColor: text("theme_secondary_color").notNull().default("#113669"),
    themeNeutralColor: text("theme_neutral_color").notNull().default("#eaeaea"),

    // ─── PWA Properties (R2 icon URLs) ───────────────────
    /** URL to the PWA icon stored in Cloudflare R2 */
    iconUrl: text("icon_url"),
    /** PWA display name shown on device home screens */
    pwaDisplayName: text("pwa_display_name"),
    /** Short description for the PWA manifest */
    pwaDescription: text("pwa_description"),

    logoUrl: text("logo_url"),
    location: text("location"),
    googleMapsLink: text("google_maps_link"),
    showLocations: integer("show_locations", { mode: "boolean" }).notNull().default(true),
    hasBranches: integer("has_branches", { mode: "boolean" }).notNull().default(false),
    branchesJson: text("branches_json").notNull().default("[]"),
    instagramUrl: text("instagram_url"),
    facebookUrl: text("facebook_url"),
    tiktokUrl: text("tiktok_url"),
    twitterUrl: text("twitter_url"),
    whatsapp: text("whatsapp"),
    telegram: text("telegram"),
    customDomain: text("custom_domain"),
    hideBranding: integer("hide_branding", { mode: "boolean" }).notNull().default(false),
    advancedColorsJson: text("advanced_colors_json").notNull().default("{}"),
    languagesJson: text("languages_json").notNull().default("[]"),
    customMenuLimit: integer("custom_menu_limit"),
    customLocationLimit: integer("custom_location_limit"),
    customRateLimit: integer("custom_rate_limit"),
    customSubdomainCooldown: integer("custom_subdomain_cooldown"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    subdomainLastChangedAt: integer("subdomain_last_changed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_tenants_subdomain").on(table.subdomain),
    index("idx_tenants_user_id").on(table.userId),
  ]
);

/**
 * Tenant Members table — links users to tenant projects with specific permission roles.
 */
export const tenantMembers = sqliteTable(
  "tenant_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", { enum: ["admin", "manager", "viewer"] })
      .notNull()
      .default("manager"),
    status: text("status", { enum: ["pending", "accepted"] })
      .notNull()
      .default("pending"),
    /** Secure random token embedded in the invitation email accept-link */
    inviteToken: text("invite_token").unique(),
    /** UTC timestamp after which the token is no longer valid (72 h) */
    inviteExpiresAt: integer("invite_expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_tenant_members_tenant_id").on(table.tenantId),
    index("idx_tenant_members_user_id").on(table.userId),
    index("idx_tenant_members_email").on(table.email),
  ]
);

/**
 * Menu Items table — Bocado restaurant menu listings.
 *
 * PRICING CONVENTION: All prices stored as integers in the smallest
 * currency unit (cents/piastres). Example: 15000 = 150.00 EGP.
 * Never use floating-point for monetary values.
 */
export const menuItems = sqliteTable(
  "menu_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    /** Price in smallest currency unit (e.g., piastres). 15000 = 150.00 EGP */
    price: integer("price").notNull(),
    currency: text("currency").notNull().default("EGP"),
    category: text("category"),
    /** URL to the menu item image stored in Cloudflare R2 */
    imageUrl: text("image_url"),
    isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_menu_items_tenant_id").on(table.tenantId),
    index("idx_menu_items_category").on(table.category),
  ]
);

/**
 * Analytics Events table — tracks visitor actions on storefronts.
 */
export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    eventType: text("event_type", { enum: ["view", "qr_scan"] })
      .notNull(),
    deviceType: text("device_type").notNull().default("desktop"),
    referrer: text("referrer"),
    /** SHA-256 hash of tenantId+IP+date — used to deduplicate unique daily visitors */
    visitorHash: text("visitor_hash"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_analytics_tenant_created").on(table.tenantId, table.createdAt),
  ]
);


/**
 * System Settings table — dynamic key-value storage for platform configurations
 */
export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * System Notifications — direct messages from platform owners to users.
 */
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: integer("is_read", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_notifications_user_read").on(table.userId, table.isRead),
  ]
);


