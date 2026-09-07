"use client";

import React, { useState } from "react";
import SidebarNav from "./SidebarNav";
import LogoutButton from "./LogoutButton";
import NotificationCenter from "./NotificationCenter";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectDashboardShellProps {
  children: React.ReactNode;
  businessName: string;
  subdomain: string;
  tier: string;
  userRole: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  isBocado: boolean;
  displaySubdomain: string;
  savedLang: string;
  t: {
    dashboard: string;
    hubHome: string;
    menuItems: string;
    kitchenOrders: string;
    visitStorefront: string;
    freeTier: string;
    proTier: string;
    enterpriseTier: string;
    settings: string;
    branding: string;
    qrCode: string;
    pwaSettings: string;
    plans: string;
    analytics: string;
  };
}

export default function ProjectDashboardShell({
  children,
  businessName,
  subdomain,
  tier,
  userRole,
  userName,
  userEmail,
  tenantId,
  isBocado,
  displaySubdomain,
  savedLang,
  t,
}: ProjectDashboardShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isRtl = savedLang === "Arabic";

  const sidebarContent = (
    // overflow-hidden here is essential — clips inner content to the sidebar bounds
    <div className="h-full flex flex-col bg-brand-white overflow-hidden">

      {/* ── Fill area: Tenant header + Nav links ── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Tenant Identity Box */}
        <div className="p-6 border-b-2 border-brand-blue bg-brand-grey/40 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-lg text-brand-blue uppercase truncate max-w-[150px]">
              {businessName}
            </h2>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[1.5px_1.5px_0px_#113669] transition-all cursor-pointer shrink-0"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2.5 h-2.5 border border-brand-blue bg-emerald-500"></span>
            <span className="font-mono text-[10px] font-bold text-brand-blue/60 truncate max-w-[180px]">
              {subdomain}
            </span>
          </div>
          <div className="mt-4 inline-flex items-center px-2.5 py-1 border border-brand-blue bg-brand-orange text-brand-white font-mono text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#113669]">
            {tier === "free"
              ? t.freeTier
              : tier === "pro"
              ? t.proTier
              : t.enterpriseTier}
          </div>
        </div>

        {/* Navigation Links — grows to fill remaining space */}
        <SidebarNav
          tenantId={tenantId}
          userRole={userRole}
          isBocado={isBocado}
          displaySubdomain={displaySubdomain}
          t={t}
        />
      </div>

      {/* ── Pinned Footer — never scrolls, always visible ── */}
      <div className="shrink-0 p-4 border-t-2 border-brand-blue bg-brand-grey/25 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-brand-blue truncate">{userName}</span>
          <span className="font-mono text-[9px] text-brand-blue/50 truncate mt-0.5">{userEmail}</span>
        </div>
        <LogoutButton variant="sidebar" lang={savedLang} />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-brand-bg text-brand-blue font-sans overflow-hidden">
      {/* ─── Mobile Sidebar Overlay Drawer ─────────────────── */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Drawer Content */}
            <motion.aside
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`relative flex flex-col w-64 h-full overflow-hidden border-brand-blue bg-brand-white shadow-[4px_0px_0px_#113669] ${
                isRtl ? "border-l-2 border-e-0 ml-auto" : "border-e-2 border-l-0 mr-auto"
              }`}
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Desktop Sidebar (Hidden on Mobile) ─────────────── */}
      <aside className="hidden md:flex flex-col h-screen z-40 w-64 border-e-2 border-brand-blue bg-brand-white shrink-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* ─── Main Content Container ───────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Navigation */}
        <header className="shrink-0 h-20 border-b-2 border-brand-blue flex items-center px-6 md:px-8 justify-between bg-brand-white/40 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1
              className="font-display font-black text-lg md:text-xl text-brand-blue uppercase tracking-tight"
              style={{ textShadow: "0.5px 0.5px 0px #f58a2d" }}
            >
              {t.dashboard}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <NotificationCenter />
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
