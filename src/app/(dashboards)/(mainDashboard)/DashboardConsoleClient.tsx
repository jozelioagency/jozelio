"use client";

import React, { useState, useTransition } from "react";
import { activateBocado } from "@/app/actions";
import Link from "next/link";
import { Globe, Briefcase, Sparkles, ChefHat, Plus, LogOut, ArrowRight, User, Search } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import NotificationCenter from "@/components/NotificationCenter";
import { BrandLogo } from "@/components/BrandLogo";

interface Project {
  id: string;
  subdomain: string;
  businessName: string;
  verticalType: string;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
  isOwner?: boolean;
  customDomain?: string | null;
}

interface DashboardConsoleClientProps {
  initialProjects: Project[];
  userName: string;
  userEmail: string;
  userImage: string | null;
  lang?: string;
}

const consoleTranslations = {
  English: {
    hubTitle: "Jozelio Hub",
    hubSubtitle: "Universal Project Center",
    exitBtn: "Exit",
    activeProjects: "Active Projects",
    newProjectBtn: "New Project",
    emptyCard: "Create New Project",
    setupCompleted: "Setup Completed",
    dashboardLink: "Dashboard",
    visitSite: "Visit Site",
    newDeployment: "New Deployment",
    backToList: "← Back to list",
    configureLaunch: "Configure & Launch",
    lockedBtn: "Locked",
    comingSoon: "COMING SOON",
    available: "Available",
    bocadoTitle: "Bocado (Restaurants)",
    bocadoDesc: "Power your restaurant or café with an instant bilingual (EN/AR) QR digital menu, PWA app presence, and custom branding configurations.",
    configureSubdomain: "Configure Subdomain",
    backBtn: "← Back",
    businessNameLabel: "Business Name",
    businessNamePlace: "Please enter the business name here...",
    subdomainLabel: "Subdomain Prefix",
    subdomainPlace: "Please enter the subdomain prefix here...",
    suffix: ".jozelio.dev:3000",
    confirmBtn: "CONFIRM CONFIGURATION",
    activating: "ACTIVATING ENGINE...",
    bocadoCafe: "Bocado Cafe",
    tierSuffix: "TIER",
    recentProjects: "Recent Projects",
    allProjects: "All Projects",
    searchPlaceholder: "SEARCH...",
  },
  Arabic: {
    hubTitle: "مركز جوزيليو",
    hubSubtitle: "مركز المشاريع الموحد",
    exitBtn: "خروج",
    activeProjects: "مشاريعك النشطة",
    newProjectBtn: "مشروع جديد",
    emptyCard: "إنشاء مشروع جديد",
    setupCompleted: "اكتمل الإعداد",
    dashboardLink: "لوحة التحكم",
    visitSite: "زيارة الموقع",
    newDeployment: "إعداد جديد",
    backToList: "← العودة للقائمة",
    configureLaunch: "تهيئة وإطلاق",
    lockedBtn: "مغلق",
    comingSoon: "قريباً",
    available: "متاح",
    bocadoTitle: "مقهى بوكادو (المطاعم)",
    bocadoDesc: "شغّل مطعمك أو مقهاك بقائمة طعام رقمية فورية ثنائية اللغة (عربي/إنجليزي)، وتطبيق جوال وتخصيص كامل للألوان والشعار.",
    configureSubdomain: "تهيئة النطاق الفرعي",
    backBtn: "← رجوع",
    businessNameLabel: "اسم النشاط التجاري",
    businessNamePlace: "الرجاء إدخال اسم النشاط التجاري هنا...",
    subdomainLabel: "بادئة النطاق الفرعي",
    subdomainPlace: "الرجاء إدخال بادئة النطاق الفرعي هنا...",
    suffix: ".jozelio.dev:3000",
    confirmBtn: "تأكيد الإعدادات والبدء",
    activating: "جاري تفعيل المحرك...",
    bocadoCafe: "مقهى بوكادو",
    tierSuffix: "باقة",
    recentProjects: "المشاريع الأخيرة",
    allProjects: "كل المشاريع",
    searchPlaceholder: "الرجاء إدخال نص البحث هنا...",
  },
};

export default function DashboardConsoleClient({
  initialProjects,
  userName,
  userEmail,
  userImage,
  lang = "English",
}: DashboardConsoleClientProps) {
  const projects = initialProjects;
  const [activeWizard, setActiveWizard] = useState<"bocado" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showWizardSelect, setShowWizardSelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const t = consoleTranslations[lang === "Arabic" ? "Arabic" : "English"];

  const handleCreateProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    startTransition(async () => {
      const res = await activateBocado(data);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success && res.tenantId) {
        // Redirect to new project's dashboard
        window.location.href = `/project/${res.tenantId}/bocado/menu`;
      }
    });
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* ─── Top Console Header ────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-2 border-brand-blue bg-brand-white shadow-[4px_4px_0px_#113669] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-white flex items-center justify-center border border-brand-blue shadow-[2px_2px_0px_#113669] p-1 shrink-0">
            <BrandLogo iconOnly size="sm" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">
              {lang === "Arabic" ? (
                <>
                  مركز <span className="text-brand-orange">جو</span>زيليو
                </>
              ) : (
                <>
                  <span className="text-brand-orange">Jo</span>zelio Hub
                </>
              )}
            </h1>
            <p className="text-[10px] text-brand-blue/50 font-mono uppercase tracking-wider font-bold">{t.hubSubtitle}</p>
          </div>
        </div>
        
        {/* User Card */}
        <div className="flex items-center gap-3 sm:gap-4 border-t border-brand-blue/15 pt-4 mt-2 sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:pl-4 sm:border-brand-blue/10 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 text-start hover:opacity-80 transition-all cursor-pointer group flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-none border border-brand-blue bg-brand-grey flex items-center justify-center text-brand-blue overflow-hidden shrink-0 group-hover:border-brand-orange transition-all">
              {userImage ? (
                userImage.startsWith("http") || userImage.startsWith("/api/media") || userImage.startsWith("data:") || userImage.startsWith("/") ? (
                  <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold leading-none">{userImage}</span>
                )
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-brand-blue truncate group-hover:text-brand-orange transition-colors">{userName}</span>
              <span className="font-mono text-[9px] text-brand-blue/50 truncate">{userEmail}</span>
            </div>
          </Link>
          <NotificationCenter />
        </div>
      </header>

      {/* ─── Wizard / Creation Form ──────────────────────── */}
      {showWizardSelect ? (
        <div className="bg-brand-white border-2 border-brand-blue p-8 shadow-[6px_6px_0px_0px_#f58a2d] relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 border-b-2 border-brand-blue pb-4">
            <div>
              <span className="font-mono text-[10px] text-brand-orange uppercase tracking-wider font-bold bg-brand-blue/5 border border-brand-blue/10 px-2.5 py-1">
                {t.newDeployment}
              </span>
              <h2 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight mt-2">
                {t.emptyCard}
              </h2>
            </div>
            <button
              onClick={() => {
                setShowWizardSelect(false);
                setActiveWizard(null);
                setError(null);
              }}
              className="text-[10px] font-mono font-bold text-brand-blue/70 hover:text-brand-orange uppercase border border-brand-blue/30 px-3.5 py-1.5 bg-brand-grey/20 transition-all cursor-pointer"
            >
              {t.backToList}
            </button>
          </div>

          {activeWizard === null ? (
            <div className="max-w-md mx-auto">
              {/* Product Card: Bocado */}
              <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_0px_#113669] flex flex-col justify-between relative group hover:-translate-y-0.5 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 border border-brand-blue bg-brand-grey text-brand-orange">
                      <ChefHat className="w-5 h-5" />
                    </span>
                    <span className="font-mono text-[9px] font-bold text-brand-white bg-brand-blue px-2.5 py-1 uppercase tracking-wider shadow-[1.5px_1.5px_0px_#f58a2d]">
                      {t.available}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-lg uppercase tracking-tight text-brand-blue">
                      {t.bocadoTitle}
                    </h3>
                    <p className="text-[11px] text-brand-blue/70 font-medium leading-relaxed">
                      {t.bocadoDesc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveWizard("bocado")}
                  className="mt-6 w-full py-2.5 border border-brand-blue bg-brand-orange text-brand-white font-mono text-[10px] uppercase tracking-wider font-black hover:bg-brand-blue hover:text-brand-white transition-all shadow-[2px_2px_0px_0px_#113669] cursor-pointer"
                >
                  {t.configureLaunch}
                </button>
              </div>
            </div>
          ) : (
            /* Configure Bocado Form */
            <div className="max-w-md mx-auto bg-brand-white border border-brand-blue/25 p-6 rounded-none text-brand-blue">
              <div className="flex justify-between items-center border-b border-brand-blue/10 pb-3 mb-5 font-mono text-xs font-black uppercase tracking-wider">
                <span>{t.configureSubdomain}</span>
                <button
                  onClick={() => {
                    setActiveWizard(null);
                    setError(null);
                  }}
                  className="text-[9px] text-[#f58a2d] hover:underline"
                >
                  {t.backBtn}
                </button>
              </div>

              {error && (
                <div className="p-3 border border-rose-500 bg-rose-50 text-rose-800 text-[11px] font-bold leading-relaxed mb-4 flex gap-2 items-start">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                <div className="space-y-1 text-start">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                    {t.businessNameLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute top-1/2 -translate-y-1/2 left-3.5 text-brand-orange">
                      <Briefcase className="w-3.5 h-3.5" />
                    </span>
                    <input
                      name="businessName"
                      type="text"
                      required
                      placeholder={t.businessNamePlace}
                      className="w-full bg-brand-bg/25 border border-brand-blue/30 rounded-none pl-10 pr-4 py-2.5 text-xs text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-start">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                    {t.subdomainLabel}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute top-1/2 -translate-y-1/2 left-3.5 text-brand-orange">
                      <Globe className="w-3.5 h-3.5" />
                    </span>
                    <input
                      name="subdomain"
                      type="text"
                      required
                      placeholder={t.subdomainPlace}
                      className="w-full bg-brand-bg/25 border border-brand-blue/30 rounded-none pl-10 pr-32 py-2.5 text-xs text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold"
                    />
                    <span className="absolute right-4 font-mono text-[9px] font-bold text-brand-blue/40 pointer-events-none">
                      {t.suffix}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono font-bold py-3 px-5 rounded-none border border-brand-blue uppercase text-[10px] tracking-wider transition-all duration-300 shadow-[3px_3px_0px_0px_#f58a2d] hover:shadow-none cursor-pointer disabled:opacity-50"
                >
                  {isPending ? t.activating : t.confirmBtn}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (() => {
        const sortedProjects = [...projects].sort((a, b) => {
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          // Fallback to insertion order (or whatever order it came in) if dates are invalid
          if (isNaN(timeA) || isNaN(timeB)) return 0;
          return timeB - timeA;
        });

        const filteredProjects = sortedProjects.filter((p) =>
          p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const recentProjects = filteredProjects.slice(0, 3);
        const allProjects = filteredProjects;

        const renderProjectCard = (project: Project, prefix: string) => {
          const isOwner = project.isOwner !== false;
          return (
            <div
              key={`${prefix}-${project.id}`}
              onClick={() => window.location.href = `/project/${project.id}/bocado/menu`}
              className={`bg-brand-white border-2 border-brand-blue p-6 flex flex-col justify-between relative group hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-300 cursor-pointer ${
                isOwner 
                  ? "shadow-[5px_5px_0px_0px_#113669]" 
                  : "shadow-[5px_5px_0px_0px_#8b5cf6] bg-slate-50/50"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  {isOwner ? (
                    <span className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-wider bg-brand-blue/5 border border-brand-blue/15 px-2 py-0.5">
                      {t.bocadoCafe}
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] font-bold text-violet-600 uppercase tracking-wider bg-violet-50 border border-violet-200 px-2 py-0.5 flex items-center gap-1">
                      👥 {lang === "Arabic" ? "مساحة مشتركة" : "Shared Workspace"}
                    </span>
                  )}
                  <span className="font-mono text-[8px] font-bold text-brand-blue/50 uppercase tracking-widest">
                    {project.tier.toUpperCase()} {t.tierSuffix}
                  </span>
                </div>
                
                <div className="space-y-1 text-start">
                  <h3 className="font-display font-black text-lg text-brand-blue uppercase tracking-tight group-hover:text-brand-orange transition-colors">
                    {project.businessName}
                  </h3>
                  <p className="font-mono text-[10px] text-brand-blue/60 font-bold truncate">
                    {project.customDomain || `${project.subdomain}.jozelio.dev:3000`}
                  </p>
                  {!isOwner && (
                    <span className="inline-block mt-1 font-mono text-[8px] font-black uppercase tracking-wider text-violet-700 bg-violet-100/60 px-2 py-0.5 border border-violet-200 shadow-[1px_1px_0px_#8b5cf6]">
                      {lang === "Arabic" ? "عضو مساهم" : "Collaborator"}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-blue/10 mt-6 flex justify-between items-center">
                <a
                  href={`http://${project.subdomain}.jozelio.dev:3000`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-blue hover:text-brand-orange transition-colors cursor-pointer"
                >
                  <span>{t.visitSite}</span>
                  <Globe className="w-3 h-3" />
                </a>
                
                <a
                  href={`/project/${project.id}/bocado/menu`}
                  className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-orange hover:text-brand-blue transition-colors cursor-pointer"
                >
                  <span>{t.dashboardLink}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          );
        };

        return (
          /* ─── Projects Listing ──────────────────────────────── */
          <div className="space-y-10">
            {/* Control Bar: Title, Search box & New Project button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-brand-blue pb-6">
              <div>
                <h2 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight">
                  {t.activeProjects}
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                {/* Search Box */}
                <div className="relative w-full sm:w-80">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue/40">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 bg-brand-white border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold shadow-[2px_2px_0px_#113669]"
                  />
                </div>

                {/* Create Project Button */}
                <button
                  onClick={() => setShowWizardSelect(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-brand-blue bg-brand-orange hover:bg-brand-blue text-brand-white font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-[2px_2px_0px_#113669] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.newProjectBtn}</span>
                </button>
              </div>
            </div>

            {/* Section 1: Recent Projects */}
            {recentProjects.length > 0 && !searchQuery.trim() && (
              <div className="space-y-4">
                <h3 className="font-display font-black text-xs text-brand-orange uppercase tracking-wider text-start">
                  <span>{t.recentProjects}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recentProjects.map((p) => renderProjectCard(p, "recent"))}
                </div>
              </div>
            )}

            {/* Section 2: All Projects */}
            <div className="space-y-4">
              <h3 className="font-display font-black text-xs text-brand-blue/80 uppercase tracking-wider text-start">
                <span>{t.allProjects}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allProjects.map((p) => renderProjectCard(p, "all"))}

                {/* Empty State / Creation Card */}
                <div
                  onClick={() => setShowWizardSelect(true)}
                  className="bg-brand-white/40 border-2 border-dashed border-brand-blue/30 p-6 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:bg-brand-white hover:border-brand-blue hover:border-solid hover:shadow-[5px_5px_0px_0px_#f58a2d] transition-all duration-300 group animate-in fade-in"
                >
                  <Plus className="w-8 h-8 text-brand-blue/40 group-hover:text-brand-orange group-hover:scale-110 transition-all mb-3" />
                  <span className="font-mono text-xs font-black uppercase text-brand-blue/50 group-hover:text-brand-blue tracking-wider">
                    {t.emptyCard}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
