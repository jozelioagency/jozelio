import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";

export const runtime = "edge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session) {
    try {
      const cookieStore = await cookies();
      cookieStore.delete("better-auth.session_token");
      cookieStore.delete("__Secure-better-auth.session_token");
    } catch {}
    redirect("/");
  }

  // 2. Setup database connection early to check ban status
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB, { schema });

  // Alter tables to add is_banned column if missing (for layout database integrity)
  try {
    await db.run(sql`ALTER TABLE user ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE user ADD COLUMN country TEXT`);
  } catch {}
  try {
    await db.run(sql`ALTER TABLE tenants ADD COLUMN subdomain_last_changed_at INTEGER`);
  } catch {}

  // Check if active user is suspended or warned
  let userWarning: { isWarned: boolean; warningReason: string | null } | null = null;
  let banDetails: { reason: string | null; expiresAt: Date | null } | null = null;
  try {
    const caller = await db
      .select({ 
        isBanned: schema.user.isBanned,
        banReason: schema.user.banReason,
        banExpiresAt: schema.user.banExpiresAt,
        isWarned: schema.user.isWarned,
        warningReason: schema.user.warningReason
      })
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .get();
      
    if (caller) {
      userWarning = {
        isWarned: caller.isWarned,
        warningReason: caller.warningReason
      };

      if (caller.isBanned && (!caller.banExpiresAt || new Date(caller.banExpiresAt) > new Date())) {
        banDetails = {
          reason: caller.banReason,
          expiresAt: caller.banExpiresAt ? new Date(caller.banExpiresAt) : null,
        };
      }
    }
  } catch (err) {
    console.error("Failed to check user suspension status in layout:", err);
  }

  if (banDetails) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-blue font-sans flex items-center justify-center p-6 text-center">
        <div className="bg-brand-white border-4 border-brand-blue p-8 max-w-md w-full shadow-[8px_8px_0px_#113669]">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center font-bold text-2xl text-rose-500 mx-auto mb-4">
            🚫
          </div>
          <h1 className="font-display font-black text-xl text-brand-blue uppercase tracking-wider mb-2">Account Suspended</h1>
          <p className="text-xs font-semibold text-brand-blue/70 leading-relaxed mb-4">
            Your account is currently suspended for policy violations.
          </p>
          
          <div className="bg-rose-50 border-2 border-rose-500 p-4 mb-6 text-left">
            <div className="font-mono text-[9px] font-black uppercase text-rose-600 tracking-wider mb-1">
              Reason for Suspension:
            </div>
            <div className="text-xs text-rose-950 font-bold">
              {banDetails.reason || "No reason provided."}
            </div>
            
            {banDetails.expiresAt && (
              <div className="mt-3 pt-2 border-t border-rose-500/20 text-[10px] text-rose-800 font-mono font-bold uppercase">
                Expires: {banDetails.expiresAt.toLocaleString()}
              </div>
            )}
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 h-10 border-2 border-brand-blue bg-rose-600 text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-rose-700 transition-all shadow-[4px_4px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // 3. Redirect to onboarding profile completion page if they don't have a username yet
  if (!session.user.username) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen relative bg-brand-bg text-brand-blue font-sans flex flex-col">

      {/* Decorative Brand Light Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-brand-blue/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-brand-orange/[0.04] blur-[150px]" />
      </div>

      <div className="relative z-10 flex-grow flex flex-col">
        {userWarning?.isWarned && (
          <div className="bg-amber-50 border-b-4 border-brand-blue p-4 flex gap-3 items-start relative z-50 text-start shadow-[0_4px_6px_-1px_rgba(17,54,105,0.05)]">
            <span className="text-xl">⚠️</span>
            <div className="flex-grow">
              <h4 className="font-display font-black text-xs text-brand-blue uppercase tracking-wide">
                Account Warning Notice
              </h4>
              <p className="text-[11px] font-semibold text-brand-blue/80 mt-1">
                {userWarning.warningReason || "A warning has been placed on your account. Please review platform rules."}
              </p>
            </div>
          </div>
        )}
        <div className="flex-grow flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
