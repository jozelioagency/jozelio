import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";
import * as schema from "@/db/schema";
import SettingsClient from "./SettingsClient";
import { cookies } from "next/headers";
import { getTenantMembers } from "@/app/actions";

export const runtime = "edge";

export default async function SettingsPage({
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

  // Only owners and admins can access settings (Team management)
  if (userRole !== "owner" && userRole !== "admin") {
    redirect(`/project/${tenantId}/bocado/branding`);
  }

  // 3. Fetch all current members/invitations for team settings
  const membersList = await getTenantMembers(tenantId);

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  return (
    <div className="max-w-6xl mx-auto">
      <SettingsClient
        tenant={tenant}
        userRole={userRole}
        members={membersList}
        lang={savedLang}
      />
    </div>
  );
}
