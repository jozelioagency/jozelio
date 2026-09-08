import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import MenuClient from "./MenuClient";
import { cookies } from "next/headers";


export default async function MenuPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  // 1. Authenticate user
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const { tenantId } = await params;

  // 2. Fetch tenant profile
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB, { schema });
  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .get();

  if (!tenant) {
    redirect("/dashboard");
  }

  // Resolve user role
  const isOwner = tenant.userId === session.user.id;
  let userRole = "owner";

  if (!isOwner) {
    const member = await db
      .select()
      .from(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.tenantId, tenantId),
          eq(schema.tenantMembers.userId, session.user.id),
          eq(schema.tenantMembers.status, "accepted")
        )
      )
      .get();
    if (member) {
      userRole = member.role;
    } else {
      redirect("/dashboard");
    }
  }

  // 3. Fetch all current menu items for this tenant
  const items = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.tenantId, tenant.id))
    .all();

  // 4. Fetch custom menu item limits from settings
  const customLimits = { free: 5, pro: 30, enterprise: 100 };
  try {
    await db.run(sql`CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`);
    const settings = await db.select().from(schema.systemSettings).all();
    settings.forEach(s => {
      if (s.key === "limit_free_menu_items" && !isNaN(parseInt(s.value))) {
        customLimits.free = parseInt(s.value);
      }
      if (s.key === "limit_pro_menu_items" && !isNaN(parseInt(s.value))) {
        customLimits.pro = parseInt(s.value);
      }
      if (s.key === "limit_enterprise_menu_items" && !isNaN(parseInt(s.value))) {
        customLimits.enterprise = parseInt(s.value);
      }
    });
  } catch (err) {
    console.error("Failed to read settings limits:", err);
  }

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  return (
    <div className="max-w-6xl mx-auto">
      <MenuClient
        initialItems={items}
        tenant={{ 
          id: tenant.id, 
          tier: tenant.tier, 
          languagesJson: tenant.languagesJson,
          customMenuLimit: tenant.customMenuLimit,
          customLimits
        }}
        lang={savedLang}
        userRole={userRole}
      />
    </div>
  );
}
