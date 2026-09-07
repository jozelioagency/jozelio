import { getSession } from "@/lib/auth-session";
import { notFound } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import AdminClient from "./AdminClient";
import { BrandLogo } from "@/components/BrandLogo";

export const runtime = "edge";

export default async function AdminPage() {
  // 1. Authenticate user session
  const session = await getSession();
  
  // 2. Rigid Server-Side Authorization: verify active session role
  const userRole = session ? (session.user as any).role : null;
  if (!session || (userRole !== "admin" && userRole !== "owner")) {
    notFound();
  }

  // 3. Setup database connection
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB, { schema });

  // Alter tables to add is_banned column if missing
  try {
    await db.run(sql`ALTER TABLE user ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE tenants ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE tenants ADD COLUMN custom_subdomain_cooldown INTEGER`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE user ADD COLUMN max_projects INTEGER NOT NULL DEFAULT 20`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE tenants ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`);
  } catch {}
  try {
    // Migrate legacy super_admin roles to admin
    await db.run(sql`UPDATE user SET role = 'admin' WHERE role = 'super_admin'`);
  } catch {}
  try {
    // Create notifications table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error("Failed to migrate notifications table:", err);
  }

  // 4. Fetch all tenants joined with their owner user accounts
  const tenantsList = await db
    .select({
      id: schema.tenants.id,
      subdomain: schema.tenants.subdomain,
      businessName: schema.tenants.businessName,
      tier: schema.tenants.tier,
      isBanned: schema.tenants.isBanned,
      createdAt: schema.tenants.createdAt,
      ownerName: schema.user.name,
      ownerEmail: schema.user.email,
      ownerId: schema.user.id,
      ownerMaxProjects: schema.user.maxProjects,
      customMenuLimit: schema.tenants.customMenuLimit,
      customLocationLimit: schema.tenants.customLocationLimit,
      customRateLimit: schema.tenants.customRateLimit,
      customSubdomainCooldown: schema.tenants.customSubdomainCooldown,
      banReason: schema.tenants.banReason,
      banExpiresAt: schema.tenants.banExpiresAt,
      isWarned: schema.tenants.isWarned,
      warningReason: schema.tenants.warningReason,
      subdomainLastChangedAt: schema.tenants.subdomainLastChangedAt,
    })
    .from(schema.tenants)
    .innerJoin(schema.user, eq(schema.tenants.userId, schema.user.id))
    .all();

  // 5. Fetch all users from the platform
  const usersList = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      username: schema.user.username,
      role: schema.user.role,
      isBanned: schema.user.isBanned,
      maxProjects: schema.user.maxProjects,
      createdAt: schema.user.createdAt,
      banReason: schema.user.banReason,
      banExpiresAt: schema.user.banExpiresAt,
      isWarned: schema.user.isWarned,
      warningReason: schema.user.warningReason,
      customUsernameCooldown: schema.user.customUsernameCooldown,
      usernameLastChangedAt: schema.user.usernameLastChangedAt,
    })
    .from(schema.user)
    .all();

  // 6. Fetch stats
  const totalMenuItemsRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.menuItems)
    .get();

  const totalMenuItems = totalMenuItemsRes?.count || 0;

  // Resolve platform owner authority
  const ownerEmail = (env as any).OWNER_EMAIL || "owner@jozelio.dev";
  const isOwner = session.user.email === ownerEmail || (session.user as any).role === "owner";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-blue font-sans flex flex-col">
      <header className="h-20 border-b-2 border-brand-blue flex items-center px-8 justify-between bg-brand-white sticky top-0 z-40 shadow-[0_2px_4px_rgba(17,54,105,0.05)]">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
        </div>
        <span className="text-[10px] text-brand-blue bg-brand-grey/20 border-2 border-brand-blue px-3 py-1.5 font-mono font-bold uppercase tracking-wide shadow-[1.5px_1.5px_0px_#113669]">
          Operator: <strong className="text-brand-orange">{session.user.name}</strong>
          {isOwner && <span className="ml-1 text-[8px] bg-brand-orange text-brand-white px-1 font-black rounded-sm">OWNER</span>}
        </span>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <AdminClient 
          initialTenants={tenantsList} 
          initialUsers={usersList} 
          totalMenuItems={totalMenuItems}
          currentOperatorId={session.user.id}
          isOwner={isOwner}
        />
      </main>
    </div>
  );
}
