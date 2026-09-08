import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and } from "drizzle-orm";
import * as schema from "@/db/schema";
import Link from "next/link";
import TranslateButton from "@/components/TranslateButton";
import WarningBanner from "@/components/WarningBanner";
import NotificationCenter from "@/components/NotificationCenter";
import SidebarNav from "@/components/SidebarNav";
import ProjectDashboardShell from "@/components/ProjectDashboardShell";


const layoutTranslations = {
  English: {
    dashboard: "Dashboard",
    hubHome: "Hub Home",
    menuItems: "Menu Items",
    kitchenOrders: "Kitchen Orders",
    visitStorefront: "Visit Storefront",
    freeTier: "free tier",
    proTier: "pro tier",
    enterpriseTier: "enterprise tier",
    settings: "Settings",
    branding: "Branding",
    qrCode: "QR Code",
    pwaSettings: "Mobile App Setup",
    plans: "Subscription Plans",
    analytics: "Analytics",
  },
  Arabic: {
    dashboard: "لوحة التحكم",
    hubHome: "الرئيسية",
    menuItems: "قائمة الطعام",
    kitchenOrders: "طلبات المطبخ",
    visitStorefront: "زيارة المتجر",
    freeTier: "الخطة المجانية",
    proTier: "الخطة الاحترافية",
    enterpriseTier: "خطة المؤسسات",
    settings: "الإعدادات",
    branding: "الهوية التجارية",
    qrCode: "رمز الـ QR",
    pwaSettings: "إعداد تطبيق الجوال",
    plans: "خطط الاشتراك",
    analytics: "التحليلات",
  },
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
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

  const { tenantId } = await params;

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";
  const t = layoutTranslations[savedLang === "Arabic" ? "Arabic" : "English"];

  // 2. Fetch tenant associated with this project and verify ownership/membership
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

  // Mark this project as "last entered/visited" by updating updatedAt
  try {
    await db
      .update(schema.tenants)
      .set({ updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId));
  } catch (err) {
    console.error("Failed to update tenant updatedAt on enter:", err);
  }

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
      // Not the owner and not an accepted member
      redirect("/dashboard");
    }
  }

  const isBocado = tenant.verticalType === "bocado_restaurant";
  const isProd = process.env.NODE_ENV === "production";
  const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || (isProd ? "jozelio.com" : "jozelio.dev");
  const isDevHost = rootDomain.includes("dev") || (!isProd && rootDomain !== "jozelio.com");
  const displaySubdomain = `${tenant.subdomain}.${rootDomain}${isDevHost ? ":3000" : ""}`;

  const isBanActive = tenant.isBanned && (
    !tenant.banExpiresAt || new Date(tenant.banExpiresAt) > new Date()
  );

  if (isBanActive) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-blue font-sans flex items-center justify-center p-6 text-center">
        <div className="bg-brand-white border-4 border-brand-blue p-8 max-w-md w-full shadow-[8px_8px_0px_#113669]">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center font-bold text-2xl text-rose-500 mx-auto mb-4">
            🚫
          </div>
          <h1 className="font-display font-black text-xl text-brand-blue uppercase tracking-wider mb-2">Project Suspended</h1>
          <p className="text-xs font-semibold text-brand-blue/70 leading-relaxed mb-4">
            This storefront project has been suspended by the platform administration.
          </p>
          
          <div className="bg-rose-50 border-2 border-rose-500 p-4 mb-6 text-left">
            <div className="font-mono text-[9px] font-black uppercase text-rose-600 tracking-wider mb-1">
              Reason for Suspension:
            </div>
            <div className="text-xs text-rose-950 font-bold">
              {tenant.banReason || "No reason specified."}
            </div>
            {tenant.banExpiresAt && (
              <div className="mt-3 pt-2 border-t border-rose-500/20 text-[10px] text-rose-800 font-mono font-bold uppercase">
                Expected Lift: {new Date(tenant.banExpiresAt).toLocaleString()}
              </div>
            )}
          </div>

          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 h-10 border-2 border-brand-blue bg-rose-600 text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-rose-700 transition-all shadow-[4px_4px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
          >
            Return to Hub Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <ProjectDashboardShell
      businessName={tenant.businessName}
      subdomain={tenant.subdomain}
      tier={tenant.tier}
      userRole={userRole}
      userName={session.user.name}
      userEmail={session.user.email}
      tenantId={tenantId}
      isBocado={isBocado}
      displaySubdomain={displaySubdomain}
      savedLang={savedLang}
      t={t}
    >
      {tenant.isWarned && (
        <WarningBanner warningReason={tenant.warningReason} username={session.user.name || "Unknown"} projectId={tenantId} />
      )}
      {children}
    </ProjectDashboardShell>
  );
}
