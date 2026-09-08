import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import PlansClient from "./PlansClient";
import { cookies } from "next/headers";


export default async function PlansPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const { tenantId } = await params;

  // 1. Fetch tenant profile
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

  // 2. Resolve user's role
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

  // Only owners and admins can manage subscription plans
  if (userRole !== "owner" && userRole !== "admin") {
    redirect(`/project/${tenantId}/bocado/branding`);
  }

  // 3. Fetch custom limits from system settings
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
      <PlansClient
        tenant={tenant}
        userRole={userRole}
        lang={savedLang}
        customLimits={customLimits}
      />
    </div>
  );
}
