"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { leaveProject } from "@/app/actions";

interface SidebarNavProps {
  tenantId: string;
  userRole: string;
  isBocado: boolean;
  displaySubdomain: string;
  t: {
    hubHome: string;
    menuItems: string;
    branding: string;
    pwaSettings: string;
    qrCode: string;
    plans: string;
    settings: string;
    visitStorefront: string;
    analytics: string;
  };
}

export default function SidebarNav({ tenantId, userRole, isBocado, displaySubdomain, t }: SidebarNavProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmLeave = () => {
    setShowConfirm(false);
    startTransition(async () => {
      const res = await leaveProject(tenantId);
      if (res?.error) {
        alert(res.error);
      } else {
        window.location.href = "/dashboard";
      }
    });
  };

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const getLinkClass = (href: string) => {
    const base = "flex items-center gap-3 px-4 flex-1 min-h-[40px] border-2 font-mono text-xs uppercase tracking-wider font-bold transition-all";
    if (isLinkActive(href)) {
      return `${base} border-brand-blue text-brand-orange bg-brand-grey/25`;
    }
    return `${base} border-transparent hover:border-brand-blue hover:bg-brand-orange text-brand-blue hover:text-brand-white`;
  };

  return (
    <nav className="flex-1 flex flex-col p-2 gap-0.5">
      {/* General Home Link */}
      <Link href="/dashboard" className={getLinkClass("/dashboard")}>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>{t.hubHome}</span>
      </Link>

      {isBocado && (
        <Link href={`/project/${tenantId}/bocado/menu`} className={getLinkClass(`/project/${tenantId}/bocado/menu`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>{t.menuItems}</span>
        </Link>
      )}

      {(userRole === "owner" || userRole === "admin" || userRole === "manager") && (
        <Link href={`/project/${tenantId}/bocado/branding`} className={getLinkClass(`/project/${tenantId}/bocado/branding`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 100-20 10 10 0 000 20zm0-15h.01M16 9h.01M16 13h.01M12 17h.01M8 13h.01M8 9h.01" />
          </svg>
          <span>{t.branding}</span>
        </Link>
      )}

      {(userRole === "owner" || userRole === "admin") && (
        <Link href={`/project/${tenantId}/bocado/pwa`} className={getLinkClass(`/project/${tenantId}/bocado/pwa`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2zM9 9h6M9 13h6" />
          </svg>
          <span>{t.pwaSettings}</span>
        </Link>
      )}

      {(userRole === "owner" || userRole === "admin" || userRole === "manager") && (
        <Link href={`/project/${tenantId}/bocado/qr`} className={getLinkClass(`/project/${tenantId}/bocado/qr`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>{t.qrCode}</span>
        </Link>
      )}

      {(userRole === "owner" || userRole === "admin" || userRole === "manager") && (
        <Link href={`/project/${tenantId}/bocado/analytics`} className={getLinkClass(`/project/${tenantId}/bocado/analytics`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>{t.analytics}</span>
        </Link>
      )}

      {(userRole === "owner" || userRole === "admin") && (
        <Link href={`/project/${tenantId}/bocado/plans`} className={getLinkClass(`/project/${tenantId}/bocado/plans`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t.plans}</span>
        </Link>
      )}

      {(userRole === "owner" || userRole === "admin") && (
        <Link href={`/project/${tenantId}/bocado/settings`} className={getLinkClass(`/project/${tenantId}/bocado/settings`)}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{t.settings}</span>
        </Link>
      )}

      {userRole !== "owner" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowConfirm(true)}
          className="flex-1 min-h-[40px] flex items-center gap-3 px-4 border-2 border-transparent hover:border-rose-500 hover:bg-rose-50 text-rose-600 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer text-start w-full disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{isPending ? (t.hubHome === "Hub Home" ? "Leaving..." : "جاري المغادرة...") : (t.hubHome === "Hub Home" ? "Leave Workspace" : "مغادرة مساحة العمل")}</span>
        </button>
      )}

      <a
        href={`http://${displaySubdomain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-dashed border-brand-blue/40 hover:border-brand-blue hover:border-solid hover:bg-brand-blue/5 text-brand-blue/80 hover:text-brand-blue font-mono text-[11px] uppercase tracking-wider font-bold transition-all"
      >
        <span>{t.visitStorefront}</span>
        <span className="text-xs">↗</span>
      </a>

      {/* ─── Custom Leave Confirmation Modal ─── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-md w-full shadow-[8px_8px_0px_#f58a2d] animate-in zoom-in-95 duration-150 text-brand-blue text-start">
            <div className="flex items-center gap-3 text-brand-orange mb-4">
              <span className="text-2xl">🚪</span>
              <h3 className="font-display font-black text-base uppercase tracking-wider">
                {t.hubHome !== "Hub Home" ? "مغادرة مساحة العمل" : "Leave Workspace"}
              </h3>
            </div>
            
            <p className="text-sm font-semibold leading-relaxed mb-6">
              {t.hubHome !== "Hub Home"
                ? "هل أنت متأكد تمامًا من أنك تريد مغادرة مساحة العمل هذه؟ ستفقد حق الوصول إليها فورًا ولن تتمكن من الدخول إليها إلا بعد دعوتك مجددًا."
                : "Are you absolutely sure you want to leave this workspace? You will lose access immediately and will need to be re-invited to collaborate."}
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-10 border-2 border-brand-blue bg-brand-grey text-brand-blue font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-bg transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {t.hubHome !== "Hub Home" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmLeave}
                className="flex-1 h-10 border-2 border-brand-blue bg-rose-600 text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-rose-700 transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
              >
                {isPending 
                  ? (t.hubHome !== "Hub Home" ? "جاري المغادرة..." : "Leaving...")
                  : (t.hubHome !== "Hub Home" ? "مغادرة وتأكيد" : "Confirm Leave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
