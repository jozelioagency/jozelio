"use client";

import React, { useState, useTransition } from "react";
import { updateTenantProfile } from "@/app/actions";
import { Info, Upload, Smartphone } from "lucide-react";

interface Tenant {
  id: string;
  businessName: string;
  subdomain: string;
  logoUrl: string | null;
  location: string | null;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themeNeutralColor: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  iconUrl: string | null;
  pwaDisplayName: string | null;
  pwaDescription: string | null;
  tier: "free" | "pro" | "enterprise";
}

interface PwaClientProps {
  tenant: Tenant;
  lang?: string;
}

const pwaTranslations = {
  English: {
    title: "Mobile App Setup",
    subtitle: "Customize how your storefront appears when customers add it to their phone screen as a downloadable mobile app.",
    pwaSec: "App Appearance Setup",
    pwaSub: "Define the app icon, name, and description when saved on a home screen.",
    pwaNameLabel: "App Icon Display Name",
    pwaNamePlace: "Please enter the app name here...",
    pwaDescLabel: "App Splash Screen Description",
    pwaDescPlace: "Please enter the app description here...",
    iconLabel: "App Home Screen Icon (512x512 recommended)",
    uploading: "Uploading...",
    selectFile: "Select Icon File",
    saveBtn: "Save Mobile App Settings",
    saving: "Saving...",
    successUpdate: "Mobile App settings saved successfully!",
    upgradeRequired: "Upgrade to PRO to unlock mobile web apps",
  },
  Arabic: {
    title: "إعداد تطبيق الجوال",
    subtitle: "تخصيص مظهر متجرك عند قيام العملاء بتنزيله وحفظه كـ تطبيق على شاشات هواتفهم.",
    pwaSec: "إعدادات مظهر التطبيق",
    pwaSub: "تحديد أيقونة التطبيق، اسم العرض، والوصف عند حفظه على شاشة الجوال.",
    pwaNameLabel: "اسم عرض أيقونة التطبيق",
    pwaNamePlace: "الرجاء إدخال اسم التطبيق هنا...",
    pwaDescLabel: "وصف واجهة التطبيق الترحيبية",
    pwaDescPlace: "الرجاء إدخال وصف التطبيق هنا...",
    iconLabel: "أيقونة التطبيق للشاشة الرئيسية (يفضل قياس 512x512 ببيكسل)",
    uploading: "جاري الرفع...",
    selectFile: "اختر أيقونة",
    saveBtn: "حفظ إعدادات تطبيق الجوال",
    saving: "جاري الحفظ...",
    successUpdate: "تم حفظ إعدادات تطبيق الجوال بنجاح!",
    upgradeRequired: "اشترك في الخطة الاحترافية لتفعيل تطبيق الجوال",
  },
};

export default function PwaClient({ tenant, lang = "English" }: PwaClientProps) {
  const [iconUrl, setIconUrl] = useState<string>(tenant.iconUrl || "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  const t = pwaTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    // Load dynamic WebP conversion module
    const { convertToWebP } = await import("@/lib/image-utils");

    let uploadFile: File | Blob = file;
    try {
      uploadFile = await convertToWebP(file);
    } catch (webpErr) {
      console.warn("Client-side WebP conversion failed, using original file:", webpErr);
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile, "pwa-icon.webp");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setIconUrl(data.url);
        setMessage({ type: "success", text: t.successUpdate });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload icon." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error uploading PWA icon." });
    } finally {
      setUploading(false);
    }
  };

  const handleSavePwaSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const pwaDisplayName = formData.get("pwaDisplayName") as string;
    const pwaDescription = formData.get("pwaDescription") as string;

    startTransition(async () => {
      const res = await updateTenantProfile({
        tenantId: tenant.id,
        businessName: tenant.businessName,
        subdomain: tenant.subdomain,
        logoUrl: tenant.logoUrl || undefined,
        location: tenant.location || undefined,
        themePrimaryColor: tenant.themePrimaryColor,
        themeSecondaryColor: tenant.themeSecondaryColor,
        themeNeutralColor: tenant.themeNeutralColor,
        instagramUrl: tenant.instagramUrl || undefined,
        facebookUrl: tenant.facebookUrl || undefined,
        tiktokUrl: tenant.tiktokUrl || undefined,
        twitterUrl: tenant.twitterUrl || undefined,
        iconUrl,
        pwaDisplayName,
        pwaDescription,
      });

      if (res && "error" in res) {
        setMessage({ type: "error", text: res.error as string });
      } else {
        setMessage({ type: "success", text: t.successUpdate });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 text-start" dir={isRtl ? "rtl" : "ltr"}>
      {/* Page Title */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669]">
        <h2 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">
          {t.title}
        </h2>
        <p className="text-brand-blue/70 text-xs mt-1 font-medium">
          {t.subtitle}
        </p>
      </div>

      {/* PWA Settings Form */}
      <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
        <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2zM9 9h6M9 13h6" />
          </svg>
          <span>{t.pwaSec}</span>
          {tenant.tier === "free" && (
            <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
              {isRtl ? "احترافي" : "PRO"}
            </span>
          )}
        </h3>
        <p className="text-brand-blue/50 text-[11px] font-medium mb-6">
          {t.pwaSub}
        </p>

        {message && (
          <div
            className={`p-3 text-xs font-bold border-2 mb-5 flex gap-2 items-start ${
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

        {tenant.tier === "free" ? (
          <div className="space-y-4">
            {/* PWA Display Name */}
            <div className="flex flex-col gap-1.5 opacity-50 select-none">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.pwaNameLabel}
              </label>
              <input
                type="text"
                disabled
                defaultValue={tenant.pwaDisplayName || tenant.businessName}
                placeholder={t.pwaNamePlace}
                className="h-10 px-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 font-semibold text-xs cursor-not-allowed"
              />
            </div>

            {/* PWA Description */}
            <div className="flex flex-col gap-1.5 opacity-50 select-none">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.pwaDescLabel}
              </label>
              <textarea
                rows={3}
                disabled
                defaultValue={tenant.pwaDescription || ""}
                placeholder={t.pwaDescPlace}
                className="p-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs resize-none font-semibold cursor-not-allowed"
              />
            </div>

            {/* PWA Icon Upload */}
            <div className="flex flex-col gap-1.5 pt-2 opacity-50 select-none">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.iconLabel}
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 h-10 px-4 border-2 border-dashed border-brand-blue/40 bg-brand-grey/25 text-brand-blue/40 font-mono text-[10px] uppercase tracking-widest font-black cursor-not-allowed">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.selectFile}</span>
                </div>
                {iconUrl && (
                  <div className="relative w-12 h-12 border-2 border-dashed border-brand-blue/40 overflow-hidden shadow-[2px_2px_0px_rgba(17,54,105,0.2)] bg-brand-grey/10 shrink-0">
                    <img src={iconUrl} alt="App Icon" className="object-contain w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-brand-blue/10">
              <p className="text-[11px] text-brand-orange font-bold flex items-center gap-1.5">
                <span>⚠</span>
                <span>{t.upgradeRequired}</span>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePwaSettings} className="space-y-4">
            {/* PWA Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.pwaNameLabel}
              </label>
              <input
                name="pwaDisplayName"
                type="text"
                required
                defaultValue={tenant.pwaDisplayName || tenant.businessName}
                placeholder={t.pwaNamePlace}
                className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs"
              />
            </div>

            {/* PWA Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.pwaDescLabel}
              </label>
              <textarea
                name="pwaDescription"
                rows={3}
                required
                defaultValue={tenant.pwaDescription || ""}
                placeholder={t.pwaDescPlace}
                className="p-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs resize-none font-semibold"
              />
            </div>

            {/* PWA Icon Upload */}
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.iconLabel}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 h-10 px-4 border-2 border-brand-blue bg-brand-grey hover:bg-brand-orange text-brand-blue hover:text-brand-white font-mono text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? t.uploading : t.selectFile}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                {iconUrl && (
                  <div className="relative w-12 h-12 border-2 border-brand-blue overflow-hidden shadow-[2px_2px_0px_#113669] bg-brand-grey/10 shrink-0">
                    <img src={iconUrl} alt="App Icon" className="object-contain w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || uploading}
              className="w-full h-11 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 mt-5 cursor-pointer"
            >
              {isPending ? t.saving : t.saveBtn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
