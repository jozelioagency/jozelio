import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";
import * as schema from "@/db/schema";
import BrandingClient from "./BrandingClient";
import { cookies } from "next/headers";


export default async function BrandingPage({
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

  // Only owners, admins, and managers can access branding
  if (userRole !== "owner" && userRole !== "admin" && userRole !== "manager") {
    redirect(`/project/${tenantId}/bocado/menu`);
  }

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  // Fetch subdomain cooldown settings & location limit
  let cooldownDays = 14;
  let locationLimit = 30;
  try {
    const settings = await db
      .select()
      .from(schema.systemSettings)
      .all();

    const cooldownRecord = settings.find(s => s.key === "subdomain_cooldown_days");
    if (cooldownRecord) {
      cooldownDays = parseInt(cooldownRecord.value);
      if (isNaN(cooldownDays)) cooldownDays = 14;
    }

    const limitRecord = settings.find(s => s.key === "location_limit");
    if (limitRecord) {
      locationLimit = parseInt(limitRecord.value);
      if (isNaN(locationLimit)) locationLimit = 30;
    }
    if (tenant.customLocationLimit !== null && tenant.customLocationLimit !== undefined) {
      locationLimit = tenant.customLocationLimit;
    }
  } catch (err) {
    console.error("Failed to fetch system settings:", err);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BrandingClient
        tenant={tenant}
        lang={savedLang}
        cooldownDays={cooldownDays}
        locationLimit={locationLimit}
      />
    </div>
  );
}
