import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import ProfileClient from "./ProfileClient";
import { cookies } from "next/headers";

export const runtime = "edge";

export default async function ProfilePage() {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  // 2. Fetch fresh user data from database
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB, { schema });

  const freshUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .get();

  if (!freshUser) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  return (
    <div className="py-8 px-6">
      <ProfileClient
        user={{
          id: freshUser.id,
          name: freshUser.name,
          email: freshUser.email,
          image: freshUser.image,
          role: freshUser.role,
          username: freshUser.username,
          nickname: freshUser.nickname,
          phoneNumber: freshUser.phoneNumber,
        }}
        lang={savedLang}
      />
    </div>
  );
}
