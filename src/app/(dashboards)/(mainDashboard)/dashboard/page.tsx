import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";
import * as schema from "@/db/schema";
import DashboardConsoleClient from "../DashboardConsoleClient";
import { cookies } from "next/headers";


export default async function DashboardPage() {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  // 2. Fetch all tenants associated with this user
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB, { schema });

  // 2a. Fetch owned projects
  const ownedProjects = await db
    .select({
      id: schema.tenants.id,
      subdomain: schema.tenants.subdomain,
      businessName: schema.tenants.businessName,
      verticalType: schema.tenants.verticalType,
      tier: schema.tenants.tier,
      createdAt: schema.tenants.createdAt,
      updatedAt: schema.tenants.updatedAt,
    })
    .from(schema.tenants)
    .where(eq(schema.tenants.userId, session.user.id))
    .all();

  // 2b. Fetch projects where the user is an accepted member
  const memberProjects = await db
    .select({
      id: schema.tenants.id,
      subdomain: schema.tenants.subdomain,
      businessName: schema.tenants.businessName,
      verticalType: schema.tenants.verticalType,
      tier: schema.tenants.tier,
      createdAt: schema.tenants.createdAt,
      updatedAt: schema.tenants.updatedAt,
    })
    .from(schema.tenantMembers)
    .innerJoin(schema.tenants, eq(schema.tenantMembers.tenantId, schema.tenants.id))
    .where(
      and(
        eq(schema.tenantMembers.userId, session.user.id),
        eq(schema.tenantMembers.status, "accepted")
      )
    )
    .all();

  // 2c. Merge, flag ownership, and deduplicate by tenant ID (prioritizing ownership)
  const seenIds = new Set<string>();
  const userProjects: Array<typeof ownedProjects[number] & { isOwner: boolean }> = [];

  for (const p of ownedProjects) {
    seenIds.add(p.id);
    userProjects.push({ ...p, isOwner: true });
  }

  for (const p of memberProjects) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      userProjects.push({ ...p, isOwner: false });
    }
  }

  // Sort projects descending by updatedAt (most recently active first) to ensure the client gets the correct order
  userProjects.sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  // 3. Render the Firebase-style main dashboard console
  return (
    <div className="py-8 px-6">
      <DashboardConsoleClient 
        initialProjects={userProjects} 
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image || null}
        lang={savedLang}
      />
    </div>
  );
}
