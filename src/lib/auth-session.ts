import { createAuth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

/**
 * Server-side session verification for Server Components and Server Actions.
 *
 * Retrieves the current user session from Better-Auth by reading
 * the request cookies/headers. Returns null if not authenticated.
 *
 * Usage in Server Components:
 *   const session = await getSession();
 *   if (!session) redirect("/login");
 *
 * Usage in Server Actions:
 *   const session = await getSession();
 *   if (session?.user.role !== "admin" && session?.user.role !== "owner") throw new Error("Unauthorized");
 */
export async function getSession() {
  const { env } = getCloudflareContext();
  const auth = createAuth(env.DB);
  const reqHeaders = await headers();

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  return session;
}

/**
 * Convenience helper that throws if no session exists.
 * Use in protected Server Actions where auth is mandatory.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}
