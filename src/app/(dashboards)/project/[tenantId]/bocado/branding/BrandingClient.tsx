"use client";

import React, { useState, useTransition } from "react";
import { updateTenantProfile } from "@/app/actions";
import { MapPin, Upload, Lock, CheckCircle2 } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";

interface Tenant {
  id: string;
  businessName: string;
  subdomain: string;
  logoUrl: string | null;
  location: string | null;
  googleMapsLink: string | null;
  hasBranches: boolean;
  branchesJson: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themeNeutralColor: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  twitterUrl?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  customDomain?: string | null;
  hideBranding: boolean;
  showLocations?: boolean;
  tier: "free" | "pro" | "enterprise";
  subdomainLastChangedAt?: Date | string | null;
  advancedColorsJson?: string | null;
}

interface BrandingClientProps {
  tenant: Tenant;
  lang?: string;
  cooldownDays: number;
  locationLimit: number;
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "jozelio.dev";

const CopyField = ({ label, value, isRtl }: { label: string; value: string; isRtl: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-2 bg-brand-white border border-brand-blue shadow-[1px_1px_0px_#113669] text-[11px] font-mono">
      <div className="flex flex-col min-w-0">
        <span className="text-[8px] font-bold text-brand-blue/40 uppercase tracking-wider">{label}</span>
        <span className="font-bold text-brand-blue truncate">{value}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-2 px-1.5 py-0.5 text-[8px] font-mono font-black uppercase bg-brand-orange text-brand-white border border-brand-blue hover:bg-brand-blue hover:text-brand-white transition-colors cursor-pointer shrink-0"
      >
        {copied ? (isRtl ? "تم" : "COPIED") : (isRtl ? "نسخ" : "COPY")}
      </button>
    </div>
  );
};

const brandingTranslations = {
  English: {
    title: "Brand Identity",
    subtitle: "Customize your brand profile details and presentation across customer storefronts.",
    brandSec: "Brand Details",
    brandSub: "Update name, subdomain, logo, and store locations.",
    bizName: "Business Name",
    subPrefix: "Subdomain Prefix",
    logoLabel: "Brand Logo",
    locationLabel: "Business Location",
    locationPlace: "Please enter the business location here...",
    uploading: "Uploading...",
    selectFile: "Select File",
    saveBtn: "Save Brand Settings",
    saving: "Saving...",
    successUpdate: "Brand settings saved successfully!",
    colorsSec: "Branding Colors",
    colorsSub: "Customize the primary, secondary, and neutral theme colors for your storefront.",
    primaryColor: "Primary Accent",
    secondaryColor: "Secondary Dark",
    neutralColor: "Neutral BG",
    advancedColorsSec: "Advanced Component Colors",
    advancedColorsSub: "Fine-tune the colors for specific components. Overrides the global theme.",
    navbarBg: "Navbar Background",
    navbarText: "Navbar Text",
    footerBg: "Footer Background",
    footerText: "Footer Text",
    cardBg: "Card Background",
    cardText: "Card Text",
    btnBg: "Button Background",
    btnText: "Button Text",
    showAdvancedBtn: "Show Advanced Settings",
    hideAdvancedBtn: "Hide Advanced Settings",
    socialSec: "Social Media Links",
    socialSub: "Configure your active social profile URLs to display them inside your customer storefront footer.",
    instagramLabel: "Instagram Link",
    facebookLabel: "Facebook Link",
    tiktokLabel: "TikTok Link",
    twitterLabel: "Twitter (X) Link",
    whatsappLabel: "WhatsApp Number",
    telegramLabel: "Telegram Username / Number",
    socialPlace: "Please enter the social link here...",
    customDomainLabel: "Custom Domain Mapping",
    customDomainPlace: "Please enter your custom domain here...",
    customDomainHint: "Map a fully qualified domain to your storefront. Requires a Pro or Enterprise subscription.",
    upgradeRequired: "Upgrade to PRO to unlock custom domains",
    guideTitle: "🌐 Custom Domain Configuration Guide",
    guideStep1: "1. Add DNS CNAME Record",
    guideStep1Text: "Point your custom domain DNS records to your current Jozelio storefront subdomain:",
    rootDomainOption: "Option A: Root Domain (e.g. mycafe.com)",
    subdomainOption: "Option B: Subdomain (e.g. menu.mycafe.com)",
    guideStep2: "2. SSL & Proxying Setup",
    guideStep2Text: "Ensure Cloudflare SSL/TLS mode is set to 'Flexible' or 'Full', and the DNS record proxy is turned ON (orange cloud) for automated SSL provisioning.",
    guideStep3: "3. Save & Verify",
    guideStep3Text: "Enter the custom domain in the field above and save the brand settings. Requests from your custom domain will now serve your storefront menu.",
    showGuideBtn: "Show Setup Guide",
    hideGuideBtn: "Hide Setup Guide",
    subdomainLocked: "Subdomain prefix locked",
    subdomainLockedDesc: "You can change your subdomain prefix again in {days} days (around {date}).",
    subdomainUnlocked: "Subdomain prefix is editable",
    subdomainUnlockedDesc: "Note: Changing your subdomain prefix will lock it for {days} days.",
    hideBrandingLabel: "Hide Jozelio Branding",
    hideBrandingDesc: "Remove 'Powered by Jozelio' from the storefront footer.",
    mapsLinkLabel: "Google Maps Link",
    mapsLinkPlace: "Please enter the Google Maps link...",
    hasBranchesLabel: "Business has branches",
    addBranchBtn: "Add Branch",
    removeBranchBtn: "Remove",
    showLocationsLabel: "Display Locations on Storefront",
    showLocationsDesc: "Show your business location and branches to your customers.",
    confirmRemoveBranch: "Are you sure you want to remove this branch?",
    branchesLimit: "You can add up to 30 branches.",
  },
  Arabic: {
    title: "الهوية التجارية",
    subtitle: "تخصيص تفاصيل علامتك التجارية وظهور نشاطك عبر متجر العملاء.",
    brandSec: "تفاصيل العلامة التجارية",
    brandSub: "تحديث الاسم، بادئة النطاق، الشعار، ومقر العمل.",
    bizName: "اسم النشاط التجاري",
    subPrefix: "بادئة النطاق الفرعي",
    logoLabel: "شعار العلامة التجارية",
    locationLabel: "عنوان أو موقع النشاط",
    locationPlace: "الرجاء إدخال عنوان أو موقع النشاط هنا...",
    uploading: "جاري الرفع...",
    selectFile: "اختر ملف",
    saveBtn: "حفظ إعدادات الهوية",
    saving: "جاري الحفظ...",
    successUpdate: "تم حفظ إعدادات الهوية بنجاح!",
    colorsSec: "أألوان الهوية التجارية",
    colorsSub: "تحديد ألوان المظهر الرئيسية، الثانوية، والمحايدة لمتجرك.",
    primaryColor: "اللون الرئيسي",
    secondaryColor: "اللون الثانوي",
    neutralColor: "الخلفية المحايدة",
    advancedColorsSec: "ألوان المكونات المتقدمة",
    advancedColorsSub: "تخصيص دقيق لألوان المكونات، وتجاوز ألوان المظهر الرئيسية.",
    navbarBg: "خلفية القائمة العلوية",
    navbarText: "نص القائمة العلوية",
    footerBg: "خلفية التذييل",
    footerText: "نص التذييل",
    cardBg: "خلفية البطاقات",
    cardText: "نص البطاقات",
    btnBg: "خلفية الأزرار",
    btnText: "نص الأزرار",
    showAdvancedBtn: "عرض الإعدادات المتقدمة",
    hideAdvancedBtn: "إخفاء الإعدادات المتقدمة",
    socialSec: "روابط التواصل الاجتماعي",
    socialSub: "قم بتهيئة روابط حسابات التواصل الاجتماعي لنشاطك لعرضها داخل تذييل متجر عملائك.",
    instagramLabel: "حساب إنستغرام",
    facebookLabel: "صفحة فيسبوك",
    tiktokLabel: "حساب تيك توك",
    twitterLabel: "حساب تويتر (X)",
    whatsappLabel: "رقم واتساب",
    telegramLabel: "اسم مستخدم أو رقم تليجرام",
    socialPlace: "الرجاء إدخال رابط الحساب هنا...",
    customDomainLabel: "ربط نطاق مخصص",
    customDomainPlace: "الرجاء إدخال النطاق المخصص هنا...",
    customDomainHint: "قم بربط نطاق مخصص بالكامل لمتجرك الرقمي. يتطلب اشتراكاً احترافياً أو مؤسسياً.",
    upgradeRequired: "اشترك في الخطة الاحترافية لتفعيل ربط النطاقات المخصصة",
    guideTitle: "🌐 دليل تهيئة النطاق المخصص",
    guideStep1: "1. إضافة سجل CNAME في الـ DNS",
    guideStep1Text: "قم بتوجيه سجلات الـ DNS لنطاقك المخصص إلى نطاق متجر جوزيليو الحالي الخاص بك:",
    rootDomainOption: "الخيار أ: النطاق الرئيسي (مثال: mycafe.com)",
    subdomainOption: "الخيار ب: النطاق الفرعي (مثال: menu.mycafe.com)",
    guideStep2: "2. إعداد شهادة الأمان SSL",
    guideStep2Text: "تأكد من تفعيل نظام تشفير SSL/TLS وتفعيل خيار البروكسي (الشبكة المحمية) لضمان إصدار شهادة الحماية تلقائياً.",
    guideStep3: "3. الحفظ والتحقق",
    guideStep3Text: "أدخل نطاقك المخصص في الحقل أعلاه واحفظ إعدادات الهوية التجارية. سيقوم النظام الآن بتوجيه زوار نطاقك المخصص إلى منيو متجرك الرقمي.",
    showGuideBtn: "عرض دليل الإعداد",
    hideGuideBtn: "إخفاء دليل الإعداد",
    subdomainLocked: "بادئة النطاق الفرعي مقفلة",
    subdomainLockedDesc: "يمكنك تغيير نطاقك الفرعي مرة أخرى بعد {days} يوم (بتاريخ {date}).",
    subdomainUnlocked: "بادئة النطاق الفرعي قابلة للتعديل",
    subdomainUnlockedDesc: "تنبيه: تغيير بادئة النطاق سيقفل إمكانية تعديلها لمدة {days} يوم.",
    hideBrandingLabel: "إخفاء شعار جوزيليو",
    hideBrandingDesc: "إزالة 'مدعوم من جوزيليو' من تذييل المتجر.",
    mapsLinkLabel: "رابط خرائط جوجل",
    mapsLinkPlace: "الرجاء إدخال رابط خرائط جوجل...",
    hasBranchesLabel: "يوجد فروع للنشاط",
    addBranchBtn: "إضافة فرع",
    removeBranchBtn: "إزالة",
    showLocationsLabel: "عرض الفروع في المتجر",
    showLocationsDesc: "إظهار موقع عملك وفروعك للعملاء.",
    confirmRemoveBranch: "هل أنت متأكد أنك تريد إزالة هذا الفرع؟",
    branchesLimit: "يمكنك إضافة حتى 30 فرع.",
  },
};

const SectionMessage = ({ msg }: { msg: { type: "success" | "error"; text: string } | null }) => {
  if (!msg) return null;
  return (
    <div
      className={`p-3 text-xs font-bold border-2 mb-5 flex gap-2 items-start ${
        msg.type === "success"
          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
          : "bg-rose-50 border-rose-500 text-rose-800"
      }`}
    >
      <span>
        {msg.type === "success" ? (
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </span>
      <p>{msg.text}</p>
    </div>
  );
};

export default function BrandingClient({ tenant, lang = "English", cooldownDays, locationLimit = 30 }: BrandingClientProps) {
  const [logoUrl, setLogoUrl] = useState<string>(tenant.logoUrl || "");
  const [themePrimaryColor, setThemePrimaryColor] = useState<string>(tenant.themePrimaryColor || "#f58a2d");
  const [themeSecondaryColor, setThemeSecondaryColor] = useState<string>(tenant.themeSecondaryColor || "#113669");
  const [themeNeutralColor, setThemeNeutralColor] = useState<string>(tenant.themeNeutralColor || "#eaeaea");

  const [hasBranches, setHasBranches] = useState<boolean>(tenant.hasBranches || false);
  const [branches, setBranches] = useState<{ location: string; googleMapsLink: string }[]>(() => {
    try {
      return JSON.parse(tenant.branchesJson || "[]");
    } catch {
      return [];
    }
  });

  const [branchToRemove, setBranchToRemove] = useState<number | null>(null);
  const [showLocations, setShowLocations] = useState<boolean>(tenant.showLocations ?? true);

  let initialAdvancedColors = {};
  try {
    initialAdvancedColors = JSON.parse(tenant.advancedColorsJson || "{}");
  } catch (e) {}

  const [advancedColors, setAdvancedColors] = useState<Record<string, string>>(initialAdvancedColors);

  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<Record<string, { type: "success" | "error"; text: string } | null>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const setSectionMessage = (section: string, msg: { type: "success" | "error"; text: string } | null) => {
    setMessages(prev => ({ ...prev, [section]: msg }));
  };
  const [showGuide, setShowGuide] = useState(false);
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  const [isPending, startTransition] = useTransition();

  const t = brandingTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";

  // Subdomain cooldown calculation
  let isSubdomainLocked = false;
  let remainingCooldownDays = 0;
  let nextSubdomainChangeDate = "";

  if (cooldownDays > 0 && tenant.subdomainLastChangedAt) {
    const lastChanged = new Date(tenant.subdomainLastChangedAt).getTime();
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - lastChanged < cooldownMs) {
      isSubdomainLocked = true;
      const remainingMs = cooldownMs - (now - lastChanged);
      remainingCooldownDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      nextSubdomainChangeDate = new Date(lastChanged + cooldownMs).toLocaleDateString(
        lang === "Arabic" ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSectionMessage("brandDetails", null);

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
      formData.append("file", uploadFile, "logo.webp");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setLogoUrl(data.url);
        setSectionMessage("brandDetails", { type: "success", text: t.successUpdate });
      } else {
        setSectionMessage("brandDetails", { type: "error", text: data.error || "Failed to upload logo." });
      }
    } catch (err: any) {
      setSectionMessage("brandDetails", { type: "error", text: "Error uploading brand logo." });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBrandSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeSection) return;
    setSectionMessage(activeSection, null);

    const formData = new FormData(e.currentTarget);
    const businessName = formData.get("businessName") as string;
    const subdomain = formData.get("subdomain") as string;
    const location = formData.get("location") as string;
    const googleMapsLink = formData.get("googleMapsLink") as string;
    const hasBranches = formData.get("hasBranches") === "on";
    const branchesJson = formData.get("branchesJson") as string;
    const instagramUrl = formData.get("instagramUrl") as string;
    const facebookUrl = formData.get("facebookUrl") as string;
    const tiktokUrl = formData.get("tiktokUrl") as string;
    const twitterUrl = formData.get("twitterUrl") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const telegram = formData.get("telegram") as string;
    const customDomain = formData.get("customDomain") as string;
    const hideBranding = formData.get("hideBranding") === "on";

    startTransition(async () => {
      const res = await updateTenantProfile({
        tenantId: tenant.id,
        businessName,
        subdomain,
        location,
        googleMapsLink,
        hasBranches,
        branchesJson,
        logoUrl,
        themePrimaryColor,
        themeSecondaryColor,
        themeNeutralColor,
        instagramUrl,
        facebookUrl,
        tiktokUrl,
        twitterUrl,
        whatsapp,
        telegram,
        customDomain,
        hideBranding,
        showLocations,
        advancedColorsJson: JSON.stringify(advancedColors),
      });

      if (res && "error" in res) {
        setSectionMessage(activeSection, { type: "error", text: res.error as string });
      } else {
        setSectionMessage(activeSection, { type: "success", text: t.successUpdate });
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

      <form onSubmit={handleSaveBrandSettings} className="flex flex-col gap-6">
        {/* Brand Form Container */}
        <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
          <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 100-20 10 10 0 000 20zm0-15h.01M16 9h.01M16 13h.01M12 17h.01M8 13h.01M8 9h.01" />
            </svg>
            <span>{t.brandSec}</span>
          </h3>
          <p className="text-brand-blue/50 text-[11px] font-medium mb-6">
            {t.brandSub}
          </p>

          {messages["brandDetails"] && <SectionMessage msg={messages["brandDetails"]} />}

          <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
              {t.bizName}
            </label>
            <input
              name="businessName"
              type="text"
              required
              defaultValue={tenant.businessName}
              placeholder={isRtl ? "الرجاء إدخال اسم النشاط التجاري هنا..." : "Please enter the business name here..."}
              className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
              {t.subPrefix}
            </label>
            <div className="relative flex items-center">
              <input
                name="subdomain"
                type="text"
                required
                disabled={isSubdomainLocked}
                defaultValue={tenant.subdomain}
                placeholder={isRtl ? "الرجاء إدخال بادئة النطاق الفرعي هنا..." : "Please enter the subdomain prefix here..."}
                className={`h-10 w-full pl-3 pr-32 text-brand-blue focus:outline-none transition-all text-xs font-semibold ${
                  isSubdomainLocked 
                    ? "cursor-not-allowed bg-brand-grey/20 border-2 border-dashed border-brand-blue/35 text-brand-blue/50" 
                    : "bg-brand-bg/25 border-2 border-brand-blue focus:bg-brand-grey/25"
                }`}
              />
              <span className={`absolute right-4 font-mono text-[9px] font-bold pointer-events-none ${
                isSubdomainLocked ? "text-brand-blue/25" : "text-brand-blue/40"
              }`}>
                .jozelio.dev:3000
              </span>
            </div>
            {isSubdomainLocked && (
              <input type="hidden" name="subdomain" value={tenant.subdomain} />
            )}
            
            {isSubdomainLocked ? (
              <div className="mt-1.5 p-2.5 border-2 border-brand-blue bg-rose-50/50 text-[10px] text-rose-800 font-bold flex items-start gap-2 shadow-[2px_2px_0px_#113669] animate-in fade-in duration-200">
                <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono uppercase text-[9px] tracking-wider text-rose-900">{t.subdomainLocked}</p>
                  <p className="mt-0.5 leading-relaxed font-semibold">
                    {t.subdomainLockedDesc.replace("{days}", String(remainingCooldownDays)).replace("{date}", nextSubdomainChangeDate)}
                  </p>
                </div>
              </div>
            ) : (
              cooldownDays > 0 && (
                <div className="mt-1.5 p-2.5 border border-brand-blue/35 bg-emerald-50/30 text-[10px] text-emerald-800 font-bold flex items-start gap-2 shadow-[1.5px_1.5px_0px_rgba(17,54,105,0.05)] animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono uppercase text-[9px] tracking-wider text-emerald-950">{t.subdomainUnlocked}</p>
                    <p className="mt-0.5 leading-relaxed font-medium text-emerald-700">
                      {t.subdomainUnlockedDesc.replace("{days}", String(cooldownDays))}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Custom Domain Input */}
          <div className="flex flex-col gap-1.5 border-t border-brand-blue/10 pt-4 mt-2">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest flex items-center gap-1.5">
              <span>{t.customDomainLabel}</span>
              {tenant.tier === "free" && (
                <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                  {isRtl ? "احترافي" : "PRO"}
                </span>
              )}
            </label>
            {tenant.tier === "free" ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  disabled
                  placeholder={t.customDomainPlace}
                  className="h-10 w-full px-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                />
                <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1">
                  <span>⚠</span>
                  <span>{t.upgradeRequired}</span>
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <input
                    name="customDomain"
                    type="text"
                    defaultValue={tenant.customDomain || ""}
                    placeholder={t.customDomainPlace}
                    className="h-10 w-full px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                  />
                  <p className="text-[9px] text-brand-blue/50 font-mono font-medium">
                    {t.customDomainHint}
                  </p>
                </div>
                
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showGuide ? "▲" : "▼"}</span>
                    <span>{showGuide ? t.hideGuideBtn : t.showGuideBtn}</span>
                  </button>
                  {showGuide && (
                    <div className="mt-3 p-4 bg-brand-bg/50 border-2 border-brand-blue shadow-[2px_2px_0px_#113669] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="font-display font-black text-xs text-brand-blue uppercase">
                        {t.guideTitle}
                      </h4>
                      <div className="flex flex-col gap-2 text-xs">
                        <div>
                          <h5 className="font-mono text-[10px] font-black text-brand-orange uppercase">
                            {t.guideStep1}
                          </h5>
                          <p className="text-[11px] text-brand-blue/70 font-semibold mt-0.5 mb-3">
                            {t.guideStep1Text}
                          </p>
                          
                          <div className="space-y-4">
                            {/* Option A: Root Domain */}
                            <div className="space-y-1.5 p-3 bg-brand-white/40 border border-brand-blue/15 shadow-[1px_1px_0px_rgba(17,54,105,0.05)]">
                              <h6 className="font-mono text-[9px] font-black text-brand-orange uppercase tracking-wide">
                                {t.rootDomainOption}
                              </h6>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <CopyField label={isRtl ? "نوع السجل" : "Record Type"} value="CNAME" isRtl={isRtl} />
                                <CopyField label={isRtl ? "الاسم / المضيف" : "Name / Host"} value="@" isRtl={isRtl} />
                                <CopyField label={isRtl ? "الهدف / القيمة" : "Target / Value"} value={`${tenant.subdomain}.${ROOT_DOMAIN}`} isRtl={isRtl} />
                              </div>
                            </div>
                            
                            {/* Option B: Subdomain */}
                            <div className="space-y-1.5 p-3 bg-brand-white/40 border border-brand-blue/15 shadow-[1px_1px_0px_rgba(17,54,105,0.05)]">
                              <h6 className="font-mono text-[9px] font-black text-brand-orange uppercase tracking-wide">
                                {t.subdomainOption}
                              </h6>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <CopyField label={isRtl ? "نوع السجل" : "Record Type"} value="CNAME" isRtl={isRtl} />
                                <CopyField label={isRtl ? "الاسم / المضيف" : "Name / Host"} value="menu" isRtl={isRtl} />
                                <CopyField label={isRtl ? "الهدف / القيمة" : "Target / Value"} value={`${tenant.subdomain}.${ROOT_DOMAIN}`} isRtl={isRtl} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-brand-blue/10 pt-2">
                          <h5 className="font-mono text-[10px] font-black text-brand-orange uppercase">
                            {t.guideStep2}
                          </h5>
                          <p className="text-[11px] text-brand-blue/70 font-semibold mt-0.5">
                            {t.guideStep2Text}
                          </p>
                        </div>
                        <div className="border-t border-brand-blue/10 pt-2">
                          <h5 className="font-mono text-[10px] font-black text-brand-orange uppercase">
                            {t.guideStep3}
                          </h5>
                          <p className="text-[11px] text-brand-blue/70 font-semibold mt-0.5">
                            {t.guideStep3Text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Hide Branding Checkbox */}
          <div className="flex flex-col gap-1.5 border-t border-brand-blue/10 pt-4 mt-2">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest flex items-center gap-1.5">
              <span>{t.hideBrandingLabel}</span>
              {tenant.tier === "free" && (
                <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                  {isRtl ? "احترافي" : "PRO"}
                </span>
              )}
            </label>
            {tenant.tier === "free" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled className="w-4 h-4 border-2 border-brand-blue/40 bg-brand-grey/25 cursor-not-allowed" />
                  <span className="text-xs text-brand-blue/40 font-semibold">{t.hideBrandingDesc}</span>
                </div>
                <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1">
                  <span>⚠</span>
                  <span>{t.upgradeRequired}</span>
                </p>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="hideBranding"
                  defaultChecked={tenant.hideBranding}
                  className="w-4 h-4 border-2 border-brand-blue bg-brand-white text-brand-orange focus:ring-brand-orange cursor-pointer"
                />
                <span className="text-xs text-brand-blue/80 font-semibold group-hover:text-brand-blue transition-colors">{t.hideBrandingDesc}</span>
              </label>
            )}
          </div>


          {/* Logo Upload */}
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest flex items-center gap-1.5">
              <span>{t.logoLabel}</span>
              {tenant.tier === "free" && (
                <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                  {isRtl ? "احترافي" : "PRO"}
                </span>
              )}
            </label>
            {tenant.tier === "free" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 h-10 px-4 border-2 border-dashed border-brand-blue/40 bg-brand-grey/25 text-brand-blue/40 font-mono text-[10px] uppercase tracking-widest font-black cursor-not-allowed w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.selectFile}</span>
                </div>
                <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1">
                  <span>⚠</span>
                  <span>{t.upgradeRequired}</span>
                </p>
              </div>
            ) : (
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
                {logoUrl && (
                  <div className="relative w-12 h-12 border-2 border-brand-blue overflow-hidden shadow-[2px_2px_0px_#113669] bg-brand-grey/10 shrink-0">
                    <img src={logoUrl} alt="Brand Logo" className="object-contain w-full h-full" />
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              onClick={() => setActiveSection("brandDetails")}
              disabled={isPending || uploading}
              className="px-6 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? t.saving : t.saveBtn}
            </button>
          </div>
        </div>

        {/* Location & Branches Section */}
        <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
          <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="text-brand-orange">
              <MapPin className="w-5 h-5" />
            </span>
            <span>{t.locationLabel} & {t.hasBranchesLabel}</span>
          </h3>
          <p className="text-brand-blue/50 text-[11px] font-medium mb-6">
            Configure your business locations and branches to display on your storefront.
          </p>

          {messages["locations"] && <SectionMessage msg={messages["locations"]} />}

          <div className="flex flex-col gap-1.5 border-b border-brand-blue/10 pb-5 mb-5">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest flex items-center gap-1.5">
              <span>{t.showLocationsLabel}</span>
            </label>
            <div className="flex items-center gap-2 cursor-pointer group w-fit" onClick={() => setShowLocations(!showLocations)}>
              <input
                type="checkbox"
                checked={showLocations}
                onChange={() => setShowLocations(!showLocations)}
                className="w-4 h-4 border-2 border-brand-blue bg-brand-white text-brand-orange focus:ring-brand-orange cursor-pointer"
              />
              <span className="text-xs text-brand-blue/80 font-semibold group-hover:text-brand-blue transition-colors">
                {t.showLocationsDesc}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest flex items-center gap-1.5">
                <span>{t.locationLabel}</span>
                {tenant.tier === "free" && (
                  <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                    {isRtl ? "احترافي" : "PRO"}
                  </span>
                )}
              </label>
              {tenant.tier === "free" ? (
                <div className="flex flex-col gap-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-brand-blue/35">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      disabled
                      placeholder={t.locationPlace}
                      className="h-10 w-full pl-10 pr-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-brand-blue/35">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      disabled
                      placeholder={t.mapsLinkPlace}
                      className="h-10 w-full pl-10 pr-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1">
                    <span>⚠</span>
                    <span>{t.upgradeRequired}</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-brand-orange">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <input
                      name="location"
                      type="text"
                      defaultValue={tenant.location || ""}
                      placeholder={t.locationPlace}
                      className="h-10 w-full pl-10 pr-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-brand-orange">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <input
                      name="googleMapsLink"
                      type="url"
                      defaultValue={tenant.googleMapsLink || ""}
                      placeholder={t.mapsLinkPlace}
                      className="h-10 w-full pl-10 pr-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  name="hasBranches"
                  checked={hasBranches}
                  onChange={(e) => setHasBranches(e.target.checked)}
                  className="w-4 h-4 border-2 border-brand-blue bg-brand-white text-brand-orange focus:ring-brand-orange cursor-pointer"
                />
                <span className="text-xs text-brand-blue/80 font-semibold group-hover:text-brand-blue transition-colors">{t.hasBranchesLabel}</span>
              </label>
            </div>

            {hasBranches && (
              <div className="flex flex-col gap-3 border-t border-brand-blue/10 pt-4 mt-2">
                <input type="hidden" name="branchesJson" value={JSON.stringify(branches)} />
                {branches.map((branch, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-brand-grey/10 border-2 border-brand-blue shadow-[2px_2px_0px_#113669] relative">
                    <button
                      type="button"
                      onClick={() => setBranchToRemove(idx)}
                      className="absolute top-2 right-2 text-rose-500 hover:text-rose-600 font-mono text-[9px] uppercase font-bold cursor-pointer"
                    >
                      {t.removeBranchBtn}
                    </button>
                    <div className="relative flex items-center mt-4">
                      <span className="absolute left-3 text-brand-orange">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={branch.location}
                        onChange={(e) => {
                          const newBranches = [...branches];
                          newBranches[idx].location = e.target.value;
                          setBranches(newBranches);
                        }}
                        placeholder={t.locationPlace}
                        className="h-10 w-full pl-10 pr-3 bg-brand-white border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                      />
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-brand-orange">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="url"
                        value={branch.googleMapsLink}
                        onChange={(e) => {
                          const newBranches = [...branches];
                          newBranches[idx].googleMapsLink = e.target.value;
                          setBranches(newBranches);
                        }}
                        placeholder={t.mapsLinkPlace}
                        className="h-10 w-full pl-10 pr-3 bg-brand-white border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>
                ))}
                {branches.length < locationLimit ? (
                  <button
                    type="button"
                    onClick={() => setBranches([...branches, { location: "", googleMapsLink: "" }])}
                    className="h-10 bg-brand-white border-2 border-brand-blue border-dashed text-brand-blue hover:text-brand-orange hover:border-brand-orange font-mono text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer mt-1"
                  >
                    + {t.addBranchBtn}
                  </button>
                ) : (
                  <p className="text-[10px] text-brand-blue/50 font-mono">
                    {isRtl ? `يمكنك إضافة حتى ${locationLimit} فرع.` : `You can add up to ${locationLimit} branches.`}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              onClick={() => setActiveSection("locations")}
              disabled={isPending || uploading}
              className="px-6 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? t.saving : t.saveBtn}
            </button>
          </div>
        </div>


        {/* Branding Colors Section */}
        <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
            <h4 className="font-display font-black text-sm text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 100-20 10 10 0 000 20zm0-15h.01M16 9h.01M16 13h.01M12 17h.01M8 13h.01M8 9h.01" />
              </svg>
              <span>{t.colorsSec}</span>
              {tenant.tier === "free" && (
                <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                  {isRtl ? "احترافي" : "PRO"}
                </span>
              )}
            </h4>
            <p className="text-brand-blue/50 text-[10px] font-medium mb-4">
              {t.colorsSub}
            </p>

            {messages["colors"] && <SectionMessage msg={messages["colors"]} />}
            
            {tenant.tier === "free" ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-4 opacity-50 select-none">
                  {/* Primary Color */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.primaryColor}
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 border-2 border-dashed border-brand-blue/40 bg-brand-orange shadow-[2.5px_2.5px_0px_rgba(17,54,105,0.2)]" />
                      <span className="font-mono text-[10px] font-bold text-brand-blue/40 uppercase">#f58a2d</span>
                    </div>
                  </div>
                  {/* Secondary Color */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.secondaryColor}
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 border-2 border-dashed border-brand-blue/40 bg-[#113669] shadow-[2.5px_2.5px_0px_rgba(17,54,105,0.2)]" />
                      <span className="font-mono text-[10px] font-bold text-brand-blue/40 uppercase">#113669</span>
                    </div>
                  </div>
                  {/* Neutral Color */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.neutralColor}
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 border-2 border-dashed border-brand-blue/40 bg-[#eaeaea] shadow-[2.5px_2.5px_0px_rgba(17,54,105,0.2)]" />
                      <span className="font-mono text-[10px] font-bold text-brand-blue/40 uppercase">#eaeaea</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1 mt-2">
                  <span>⚠</span>
                  <span>{t.upgradeRequired}</span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {/* Primary Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.primaryColor}
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={themePrimaryColor}
                      onChange={(e) => setThemePrimaryColor(e.target.value)}
                      className="w-10 h-10 border-2 border-brand-blue cursor-pointer shadow-[2.5px_2.5px_0px_#113669] bg-transparent"
                    />
                    <span className="font-mono text-[10px] font-bold text-brand-blue/60 uppercase">
                      {themePrimaryColor}
                    </span>
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.secondaryColor}
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={themeSecondaryColor}
                      onChange={(e) => setThemeSecondaryColor(e.target.value)}
                      className="w-10 h-10 border-2 border-brand-blue cursor-pointer shadow-[2.5px_2.5px_0px_#113669] bg-transparent"
                    />
                    <span className="font-mono text-[10px] font-bold text-brand-blue/60 uppercase">
                      {themeSecondaryColor}
                    </span>
                  </div>
                </div>

                {/* Neutral Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.neutralColor}
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={themeNeutralColor}
                      onChange={(e) => setThemeNeutralColor(e.target.value)}
                      className="w-10 h-10 border-2 border-brand-blue cursor-pointer shadow-[2.5px_2.5px_0px_#113669] bg-transparent"
                    />
                    <span className="font-mono text-[10px] font-bold text-brand-blue/60 uppercase">
                      {themeNeutralColor}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={() => setActiveSection("colors")}
                disabled={isPending || uploading}
                className="px-6 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? t.saving : t.saveBtn}
              </button>
            </div>
          </div>

        {/* Advanced Branding Colors Section */}
        <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
            <h4 className="font-display font-black text-sm text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span>{t.advancedColorsSec}</span>
              {tenant.tier === "free" && (
                <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                  {isRtl ? "احترافي" : "PRO"}
                </span>
              )}
            </h4>
            <p className="text-brand-blue/50 text-[10px] font-medium mb-4">
              {t.advancedColorsSub}
            </p>

            {messages["advancedColors"] && <SectionMessage msg={messages["advancedColors"]} />}

            <button
              type="button"
              onClick={() => setShowAdvancedColors(!showAdvancedColors)}
              className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer mb-4"
            >
              <span>{showAdvancedColors ? "▲" : "▼"}</span>
              <span>{showAdvancedColors ? t.hideAdvancedBtn : t.showAdvancedBtn}</span>
            </button>
            
            {showAdvancedColors && (
              tenant.tier === "free" ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-50 select-none">
                  {/* Dummy Inputs */}
                  {["navbarBg", "navbarText", "footerBg", "footerText", "cardBg", "cardText", "btnBg", "btnText"].map(key => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest truncate">
                        {(t as any)[key]}
                      </label>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 border-2 border-dashed border-brand-blue/40 bg-brand-grey/50 shadow-[2.5px_2.5px_0px_rgba(17,54,105,0.2)]" />
                        <span className="font-mono text-[10px] font-bold text-brand-blue/40 uppercase">---</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1 mt-2">
                  <span>⚠</span>
                  <span>{t.upgradeRequired}</span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: "navbarBgColor", label: t.navbarBg, default: "transparent" },
                  { key: "navbarTextColor", label: t.navbarText, default: "#113669" },
                  { key: "footerBgColor", label: t.footerBg, default: "transparent" },
                  { key: "footerTextColor", label: t.footerText, default: "#113669" },
                  { key: "cardBgColor", label: t.cardBg, default: "#ffffff" },
                  { key: "cardTextColor", label: t.cardText, default: "#113669" },
                  { key: "buttonBgColor", label: t.btnBg, default: "#f58a2d" },
                  { key: "buttonTextColor", label: t.btnText, default: "#ffffff" },
                ].map(({ key, label, default: def }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest truncate" title={label}>
                      {label}
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={advancedColors[key] || def}
                        onChange={(e) => setAdvancedColors(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-10 h-10 border-2 border-brand-blue cursor-pointer shadow-[2.5px_2.5px_0px_#113669] bg-transparent"
                      />
                      <span className="font-mono text-[10px] font-bold text-brand-blue/60 uppercase w-16 truncate">
                        {advancedColors[key] || def}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={() => setActiveSection("advancedColors")}
                disabled={isPending || uploading}
                className="px-6 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? t.saving : t.saveBtn}
              </button>
            </div>
          </div>

        {/* Social Links Section */}
        <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
            <h4 className="font-display font-black text-sm text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🔗 {t.socialSec}</span>
              {tenant.tier === "free" && (
                <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                  {isRtl ? "احترافي" : "PRO"}
                </span>
              )}
            </h4>
            <p className="text-brand-blue/50 text-[10px] font-medium mb-4">
              {t.socialSub}
            </p>

            {messages["socials"] && <SectionMessage msg={messages["socials"]} />}

            {tenant.tier === "free" ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 select-none">
                  {/* Instagram URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.instagramLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder={t.socialPlace}
                      className="h-10 px-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  {/* Facebook URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.facebookLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder={t.socialPlace}
                      className="h-10 px-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  {/* TikTok URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.tiktokLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder={t.socialPlace}
                      className="h-10 px-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  {/* Twitter URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.twitterLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder={t.socialPlace}
                      className="h-10 px-3 bg-brand-grey/25 border-2 border-dashed border-brand-blue/40 text-brand-blue/40 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  {/* WhatsApp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.whatsappLabel}
                    </label>
                    <PhoneInput
                      name="whatsapp"
                      disabled={true}
                      placeholder={t.socialPlace}
                      isRtl={isRtl}
                    />
                  </div>
                  {/* Telegram */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                      {t.telegramLabel}
                    </label>
                    <PhoneInput
                      name="telegram"
                      disabled={true}
                      placeholder={t.socialPlace}
                      isRtl={isRtl}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1 mt-2">
                  <span>⚠</span>
                  <span>{t.upgradeRequired}</span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.instagramLabel}
                  </label>
                  <input
                    name="instagramUrl"
                    type="url"
                    defaultValue={tenant.instagramUrl || ""}
                    placeholder={t.socialPlace}
                    className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                  />
                </div>

                {/* Facebook URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.facebookLabel}
                  </label>
                  <input
                    name="facebookUrl"
                    type="url"
                    defaultValue={tenant.facebookUrl || ""}
                    placeholder={t.socialPlace}
                    className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                  />
                </div>

                {/* TikTok URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.tiktokLabel}
                  </label>
                  <input
                    name="tiktokUrl"
                    type="url"
                    defaultValue={tenant.tiktokUrl || ""}
                    placeholder={t.socialPlace}
                    className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                  />
                </div>

                {/* Twitter URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.twitterLabel}
                  </label>
                  <input
                    name="twitterUrl"
                    type="url"
                    defaultValue={tenant.twitterUrl || ""}
                    placeholder={t.socialPlace}
                    className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
                  />
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.whatsappLabel}
                  </label>
                  <PhoneInput
                    name="whatsapp"
                    defaultValue={tenant.whatsapp || ""}
                    placeholder={t.socialPlace}
                    isRtl={isRtl}
                  />
                </div>

                {/* Telegram */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                    {t.telegramLabel}
                  </label>
                  <PhoneInput
                    name="telegram"
                    defaultValue={tenant.telegram || ""}
                    placeholder={t.socialPlace}
                    isRtl={isRtl}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                onClick={() => setActiveSection("socials")}
                disabled={isPending || uploading}
                className="px-6 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? t.saving : t.saveBtn}
              </button>
            </div>
          </div>
        </form>

        {/* Branch Removal Modal */}
        {branchToRemove !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue/80 backdrop-blur-sm">
            <div className="bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#113669] w-full max-w-sm p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
              {/* Modal Content */}
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-display font-black text-lg text-brand-blue uppercase tracking-tight leading-none mb-1">
                    {t.removeBranchBtn}
                  </h3>
                  <p className="text-brand-blue/70 text-xs font-semibold leading-snug">
                    {t.confirmRemoveBranch}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t-2 border-brand-blue/10">
                <button
                  type="button"
                  onClick={() => setBranchToRemove(null)}
                  className="px-4 py-2 border-2 border-brand-blue bg-brand-white hover:bg-brand-grey/20 text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newBranches = [...branches];
                    newBranches.splice(branchToRemove, 1);
                    setBranches(newBranches);
                    setBranchToRemove(null);
                  }}
                  className="px-4 py-2 border-2 border-brand-blue bg-rose-500 hover:bg-rose-600 text-brand-white font-mono text-[10px] uppercase tracking-widest font-black transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  {t.removeBranchBtn}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
