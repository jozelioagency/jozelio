"use client";

import React, { useState, useTransition } from "react";
import { Check, Zap, Award, Sparkles, Lock } from "lucide-react";
import { updateTenantTier } from "@/app/actions";

interface Tenant {
  id: string;
  tier: "free" | "pro" | "enterprise";
  businessName: string;
}

interface PlansClientProps {
  tenant: Tenant;
  userRole: string;
  lang?: string;
  customLimits?: { free: number; pro: number; enterprise: number };
}

const planTranslations = {
  English: {
    title: "Subscription Plans",
    subtitle: "Select the ideal tier to power your digital menu storefront.",
    freeTitle: "Free Plan",
    freeDesc: "Perfect for testing or small cafes starting out.",
    proTitle: "Pro Plan",
    proDesc: "Unlock full visual customization and unlimited listings.",
    entTitle: "Enterprise Plan",
    entDesc: "Tailored engine for large restaurant groups and chains.",
    monthSuffix: "/ Month",
    customPrice: "Custom",
    featuresTitle: "Included Features:",
    currentPlan: "Current Plan",
    activate: "Activate Plan",
    contactUs: "Contact Us",
    successMsg: "Plan updated successfully!",
    errorMsg: "Failed to update plan. Please try again.",
    menuLimit: "Up to 5 menu items",
    pwaLimit: "Mobile web browser viewing only",
    brandingLimit: "Default theme styling only",
    langLimitFree: "English + 1 secondary language",
    langLimitPro: "Up to 50 secondary languages",
    menuUnlimited: "Up to 30 menu items",
    pwaFull: "Turn your menu into a downloadable Mobile App",
    brandingFull: "Full branding colors & R2 logo uploads",
    socialLinks: "Social media links integration",
    locationSupport: "Business location mapping",
    customDomain: "Custom domain mapping (e.g. menu.mycafe.com)",
    sla: "99.9% uptime SLA & priority support",
    multiProject: "Multi-tenant project cluster support",
    customIntegrations: "API access & third-party integrations",
    menuEntLimit: "Up to 100+ menu items",
  },
  Arabic: {
    title: "خطط الاشتراك",
    subtitle: "اختر الباقة المثالية لتشغيل متجر قائمة طعامك الرقمية.",
    freeTitle: "الخطة المجانية",
    freeDesc: "مثالية للتجربة أو المقاهي الصغيرة في البداية.",
    proTitle: "الخطة الاحترافية",
    proDesc: "افتح التخصيص البصري الكامل وقوائم غير محدودة.",
    entTitle: "خطة المؤسسات",
    entDesc: "محرك مخصص لمجموعات المطاعم الكبرى وسلاسل الفروع.",
    monthSuffix: "/ شهرياً",
    customPrice: "مخصص",
    featuresTitle: "الميزات المضمنة:",
    currentPlan: "الخطة الحالية",
    activate: "تفعيل الخطة",
    contactUs: "اتصل بنا",
    successMsg: "تم تحديث الخطة بنجاح!",
    errorMsg: "فشل تحديث الخطة. الرجاء المحاولة مرة أخرى.",
    menuLimit: "ما يصل إلى 5 أصناف في المنيو",
    pwaLimit: "التصفح الافتراضى عبر المتصفح فقط",
    brandingLimit: "ألوان الهوية الافتراضية فقط",
    langLimitFree: "الإنجليزية + لغة ثانوية واحدة",
    langLimitPro: "ما يصل إلى 50 لغة ثانوية إضافية",
    menuUnlimited: "ما يصل إلى 30 صنف في المنيو",
    pwaFull: "تحويل المنيو إلى تطبيق جوال قابل للتثبيت",
    brandingFull: "تخصيص كامل للألوان ورفع الشعارات",
    socialLinks: "ربط حسابات التواصل الاجتماعي بالمتجر",
    locationSupport: "تحديد مقر وموقع النشاط التجاري",
    customDomain: "ربط نطاق مخصص (مثال: menu.mycafe.com)",
    sla: "ضمان تشغيل بنسبة 99.9% ودعم فني ذي أولوية",
    multiProject: "دعم تجميع مشاريع متعددة المستأجرين",
    customIntegrations: "الوصول إلى واجهة برمجة التطبيقات والتكاملات الخارجية",
    menuEntLimit: "ما يصل إلى {count} صنف أو أكثر",
  },
};

export default function PlansClient({ tenant, userRole, lang = "English", customLimits }: PlansClientProps) {
  const [currentTier, setCurrentTier] = useState<"free" | "pro" | "enterprise">(tenant.tier);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const limits = customLimits || { free: 5, pro: 30, enterprise: 100 };
  const t = planTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";

  const handlePlanWhatsAppRedirect = (tier: "free" | "pro" | "enterprise") => {
    if (tier === currentTier) return;
    const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201234567890";
    const cleanNumber = rawNumber.replace(/[^\d]/g, "");
    const messageText = encodeURIComponent(
      `Hi, I want to activate/upgrade my business "${tenant.businessName}" (Workspace ID: ${tenant.id}) to the ${tier.toUpperCase()} plan.`
    );
    const link = `https://wa.me/${cleanNumber}?text=${messageText}`;
    window.open(link, "_blank");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669]">
        <h2 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">
          {t.title}
        </h2>
        <p className="text-brand-blue/70 text-xs mt-1 font-medium">
          {t.subtitle}
        </p>
      </div>

      {message && (
        <div
          className={`p-4 text-xs font-bold flex items-start gap-2 border-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
              : "bg-rose-50 border-rose-500 text-rose-800"
          }`}
        >
          <span>
            {message.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </span>
          <p>{message.text}</p>
        </div>
      )}

      {/* Plans list */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        
        {/* FREE PLAN */}
        <div className={`p-6 bg-brand-white border-2 border-brand-blue flex flex-col justify-between relative shadow-[4px_4px_0px_#113669] transition-transform duration-200 ${
          currentTier === "free" ? "border-brand-orange shadow-[4px_4px_0px_#f58a2d]" : ""
        }`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-base text-brand-blue uppercase">{t.freeTitle}</h3>
              {currentTier === "free" && (
                <span className="font-mono text-[8px] font-black text-brand-white bg-brand-orange border border-brand-blue px-2 py-0.5 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-blue/60 leading-relaxed mb-6 font-medium">
              {t.freeDesc}
            </p>
            <div className="mb-6">
              <span className="font-display font-black text-3xl text-brand-blue">0</span>
              <span className="font-mono text-xs font-bold text-brand-blue/50 ml-1">EGP</span>
            </div>

            <div className="border-t border-brand-blue/15 pt-4 mb-6">
              <h4 className="font-mono text-[9px] font-bold text-brand-blue/50 uppercase tracking-widest mb-3">
                {t.featuresTitle}
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-brand-blue">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {lang === "Arabic" 
                      ? `ما يصل إلى ${limits.free} أصناف في المنيو` 
                      : `Up to ${limits.free} menu items`}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.brandingLimit}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.langLimitFree}</span>
                </li>
                <li className="flex items-center gap-2 text-brand-blue/35 line-through decoration-brand-orange">
                  <Lock className="w-3.5 h-3.5 text-brand-orange/60 shrink-0" />
                  <span>{t.pwaFull}</span>
                </li>
                <li className="flex items-center gap-2 text-brand-blue/35 line-through decoration-brand-orange">
                  <Lock className="w-3.5 h-3.5 text-brand-orange/60 shrink-0" />
                  <span>{t.locationSupport}</span>
                </li>
                <li className="flex items-center gap-2 text-brand-blue/35 line-through decoration-brand-orange">
                  <Lock className="w-3.5 h-3.5 text-brand-orange/60 shrink-0" />
                  <span>{t.socialLinks}</span>
                </li>
                <li className="flex items-center gap-2 text-brand-blue/35 line-through decoration-brand-orange">
                  <Lock className="w-3.5 h-3.5 text-brand-orange/60 shrink-0" />
                  <span>{t.customDomain}</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => handlePlanWhatsAppRedirect("free")}
            disabled={currentTier === "free"}
            className={`w-full h-11 font-mono text-[10px] uppercase tracking-widest font-black border-2 transition-all duration-300 cursor-pointer ${
              currentTier === "free"
                ? "bg-brand-grey border-brand-blue text-brand-blue/50 opacity-80 cursor-not-allowed"
                : "bg-brand-white border-brand-blue text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
            }`}
          >
            {currentTier === "free" ? t.currentPlan : t.activate}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className={`p-6 bg-brand-white border-2 border-brand-blue flex flex-col justify-between relative shadow-[4px_4px_0px_#113669] transition-transform duration-200 ${
          currentTier === "pro" ? "border-brand-orange shadow-[4px_4px_0px_#f58a2d]" : ""
        }`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-base text-brand-blue uppercase flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-orange" />
                <span>{t.proTitle}</span>
              </h3>
              {currentTier === "pro" && (
                <span className="font-mono text-[8px] font-black text-brand-white bg-brand-orange border border-brand-blue px-2 py-0.5 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-blue/60 leading-relaxed mb-6 font-medium">
              {t.proDesc}
            </p>
            <div className="mb-6">
              <span className="font-display font-black text-3xl text-brand-blue">199</span>
              <span className="font-mono text-xs font-bold text-brand-blue/50 ml-1">EGP {t.monthSuffix}</span>
            </div>

            <div className="border-t border-brand-blue/15 pt-4 mb-6">
              <h4 className="font-mono text-[9px] font-bold text-brand-blue/50 uppercase tracking-widest mb-3">
                {t.featuresTitle}
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-brand-blue">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {lang === "Arabic" 
                      ? `ما يصل إلى ${limits.pro} صنف في المنيو` 
                      : `Up to ${limits.pro} menu items`}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.brandingFull}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.langLimitPro}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.pwaFull}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.socialLinks}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.locationSupport}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.customDomain}</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => handlePlanWhatsAppRedirect("pro")}
            disabled={currentTier === "pro"}
            className={`w-full h-11 font-mono text-[10px] uppercase tracking-widest font-black border-2 transition-all duration-300 cursor-pointer ${
              currentTier === "pro"
                ? "bg-brand-grey border-brand-blue text-brand-blue/50 opacity-80 cursor-not-allowed"
                : "bg-brand-blue border-brand-blue text-brand-white hover:bg-brand-orange hover:text-brand-blue shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0"
            }`}
          >
            {currentTier === "pro" ? t.currentPlan : t.activate}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className={`p-6 bg-brand-white border-2 border-brand-blue flex flex-col justify-between relative shadow-[4px_4px_0px_#113669] transition-transform duration-200 ${
          currentTier === "enterprise" ? "border-brand-orange shadow-[4px_4px_0px_#f58a2d]" : ""
        }`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-base text-brand-blue uppercase flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-orange" />
                <span>{t.entTitle}</span>
              </h3>
              {currentTier === "enterprise" && (
                <span className="font-mono text-[8px] font-black text-brand-white bg-brand-orange border border-brand-blue px-2 py-0.5 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-blue/60 leading-relaxed mb-6 font-medium">
              {t.entDesc}
            </p>
            <div className="mb-6">
              <span className="font-display font-black text-2xl text-brand-blue uppercase">{t.customPrice}</span>
            </div>

            <div className="border-t border-brand-blue/15 pt-4 mb-6">
              <h4 className="font-mono text-[9px] font-bold text-brand-blue/50 uppercase tracking-widest mb-3">
                {t.featuresTitle}
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-brand-blue">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {lang === "Arabic" 
                      ? `ما يصل إلى ${limits.enterprise} صنف أو أكثر` 
                      : `Up to ${limits.enterprise}+ menu items`}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.customDomain}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.sla}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.multiProject}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.customIntegrations}</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => handlePlanWhatsAppRedirect("enterprise")}
            disabled={currentTier === "enterprise"}
            className={`w-full h-11 font-mono text-[10px] uppercase tracking-widest font-black border-2 transition-all duration-300 cursor-pointer ${
              currentTier === "enterprise"
                ? "bg-brand-grey border-brand-blue text-brand-blue/50 opacity-80 cursor-not-allowed"
                : "bg-brand-white border-brand-blue text-brand-blue hover:bg-brand-grey shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 flex items-center justify-center"
            }`}
          >
            {t.contactUs}
          </button>
        </div>

      </div>
    </div>
  );
}
