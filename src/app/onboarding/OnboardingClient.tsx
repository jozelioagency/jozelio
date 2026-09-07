"use client";

import React, { useState, useTransition, useRef } from "react";
import { completeUserOnboarding } from "@/app/actions";
import { User, Sparkles, AlertTriangle, Upload, X, Image } from "lucide-react";
import Footer from "@/components/Footer";
import CountrySelect from "@/components/CountrySelect";
import Link from "next/link";

interface OnboardingClientProps {
  userEmail: string;
  initialName: string;
  initialImage: string | null;
  lang?: string;
}

const translations = {
  English: {
    badge: "00 / Welcome to Jozelio",
    title: "Complete Your Profile",
    desc: "Welcome! To unlock your universal dashboard, please configure your unique username, nickname, and choose your account avatar.",
    formHeading: "Onboarding Details",
    formSubheading: "Finalize your identity setup below",
    usernameLabel: "Unique Username (Required)",
    usernamePlace: "Please enter your username here...",
    nicknameLabel: "Nickname (Optional)",
    nicknamePlace: "Please enter your nickname here...",
    avatarLabel: "Profile Avatar",
    avatarPreset: "Choose a Preset",
    avatarCustom: "Upload Custom Photo",
    googlePfp: "Google Profile Photo",
    uploading: "Uploading...",
    uploadBtn: "Upload Image",
    btnSubmit: "Complete Setup & Launch Dashboard",
    loading: "PREPARING ENGINE...",
    errorOccurred: "An error occurred. Please try again.",
    validationInfo: "Username must be 3-20 characters and contain only lowercase letters, numbers, hyphens, and underscores.",
  },
  Arabic: {
    badge: "00 / مرحباً بك في جوزيليو",
    title: "أكمل ملفك الشخصي",
    desc: "أهلاً بك! لتفعيل لوحة التحكم الموحدة، يرجى إعداد اسم المستخدم الفريد واللقب واختيار صورة الحساب.",
    formHeading: "تفاصيل الملف الشخصي",
    formSubheading: "أكمل إعداد هويتك الرقمية أدناه",
    usernameLabel: "اسم المستخدم الفريد (مطلوب)",
    usernamePlace: "الرجاء إدخال اسم المستخدم هنا...",
    nicknameLabel: "اللقب أو الاسم المستعار (اختياري)",
    nicknamePlace: "الرجاء إدخال اللقب هنا...",
    avatarLabel: "صورة الملف الشخصي",
    avatarPreset: "اختر من الأيقونات الجاهزة",
    avatarCustom: "رفع صورة مخصصة",
    googlePfp: "صورة حساب جوجل",
    uploading: "جاري الرفع...",
    uploadBtn: "رفع صورة",
    btnSubmit: "إكمال الإعداد وتشغيل لوحة التحكم",
    loading: "جاري تهيئة النظام...",
    errorOccurred: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    validationInfo: "يجب أن يتراوح اسم المستخدم بين 3 و20 حرفاً ويحتوي فقط على أحرف صغيرة وأرقام وشرطات وشرطات سفلية.",
  }
};

const PRESET_ICONS = [
  "/characters/bocado/symbol.png",
  "/characters/bocado/mascot.png",
  "/characters/corza/symbol.png",
  "/characters/corza/mascot.png",
  "/characters/julia/symbol.png",
  "/characters/julia/mascot.png"
];

type AvatarTab = "google" | "preset" | "custom";

export default function OnboardingClient({ userEmail, initialName, initialImage, lang = "English" }: OnboardingClientProps) {
  const [username, setUsername] = useState("");
  // Auto-fill nickname from the Google account display name
  const [nickname, setNickname] = useState(initialName || "");
  // Pre-select Google pfp if available, otherwise first preset
  const [selectedAvatar, setSelectedAvatar] = useState<string>(initialImage || PRESET_ICONS[0]);
  const [activeTab, setActiveTab] = useState<AvatarTab>(initialImage ? "google" : "preset");
  const [customImageUrl, setCustomImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [country, setCountry] = useState<string>("Egypt");
  const [agreed, setAgreed] = useState<boolean>(false);

  const currentLang = lang === "Arabic" ? "Arabic" : "English";
  const t = translations[currentLang];
  const isRtl = currentLang === "Arabic";

  // Current effective avatar based on the active tab
  const effectiveAvatar = activeTab === "google"
    ? (initialImage || PRESET_ICONS[0])
    : activeTab === "preset"
    ? selectedAvatar
    : (customImageUrl || selectedAvatar);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

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
      formData.append("file", uploadFile, "avatar.webp");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json() as any;
      if (res.ok && data.url) {
        setCustomImageUrl(data.url);
      } else {
        setUploadError(data.error || "Upload failed");
      }
    } catch {
      setUploadError("Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!agreed) {
      setError(isRtl ? "يجب الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة." : "You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    if (!cleanUsername) {
      setError(isRtl ? "اسم المستخدم مطلوب" : "Username is required");
      return;
    }
    if (!/^[a-z0-9_-]{3,20}$/.test(cleanUsername)) {
      setError(t.validationInfo);
      return;
    }

    startTransition(async () => {
      const res = await completeUserOnboarding({
        username: cleanUsername,
        nickname: nickname.trim() || undefined,
        image: effectiveAvatar,
        country: country,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        window.location.href = "/dashboard";
      }
    });
  };

  const tabBtn = (tab: AvatarTab, label: string, show: boolean) => {
    if (!show) return null;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-2 px-3 font-mono text-[9px] uppercase font-black tracking-wider border-2 transition-all cursor-pointer ${
          activeTab === tab
            ? "bg-brand-blue text-brand-white border-brand-blue shadow-[2px_2px_0px_#f58a2d]"
            : "bg-brand-white text-brand-blue border-brand-blue/40 hover:border-brand-blue hover:bg-brand-grey/30"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-brand-bg text-brand-blue font-sans selection:bg-brand-orange/30 selection:text-brand-orange pt-16 flex flex-col justify-between" dir={isRtl ? "rtl" : "ltr"}>
      {/* Decorative Brand Light Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-brand-blue/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-brand-orange/[0.04] blur-[150px]" />
      </div>



      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 w-full mb-16 flex-grow flex flex-col justify-center">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-4">
          <span className="font-mono text-[10px] text-brand-orange tracking-widest uppercase font-bold bg-brand-blue/5 border border-brand-blue/15 px-3.5 py-1.5 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" /> {t.badge}
          </span>
          <h2
            className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-brand-blue uppercase tracking-tighter leading-none"
            style={{ textShadow: "1px 1px 0px #f58a2d, 2px 2px 0px #f58a2d" }}
          >
            {t.title}
          </h2>
          <p className="text-brand-blue/80 text-xs leading-relaxed font-medium">{t.desc}</p>
        </div>

        {/* Card */}
        <div className="bg-brand-white border-2 border-brand-blue rounded-none p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(245,138,45,1)] text-brand-blue relative">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-orange -translate-x-1 -translate-y-1" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-orange translate-x-1 -translate-y-1" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-orange -translate-x-1 translate-y-1" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-orange translate-x-1 translate-y-1" />

          <div className="space-y-6">
            <div className="border-b-2 border-brand-blue pb-4">
              <h3 className="font-display font-black text-lg text-brand-blue uppercase tracking-tight">{t.formHeading}</h3>
              <p className="text-[10px] text-brand-blue/60 font-mono uppercase tracking-wider">{t.formSubheading}</p>
            </div>

            {error && (
              <div className="p-4 text-xs font-bold flex items-start gap-2 border-2 bg-rose-50 border-rose-500 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">{t.usernameLabel}</label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder={t.usernamePlace}
                    className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold`}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <p className="text-[9px] text-brand-blue/50 leading-normal font-medium">{t.validationInfo}</p>
              </div>

              {/* Nickname — auto-filled from Google name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">{t.nicknameLabel}</label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={t.nicknamePlace}
                    className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold`}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5 text-start">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                  {isRtl ? "اختر الدولة / المنطقة" : "Country / Region"}
                </label>
                <CountrySelect value={country} onChange={setCountry} lang={lang || "English"} isRtl={isRtl} />
              </div>

              {/* Avatar Section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">{t.avatarLabel}</label>

                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border-2 border-brand-blue shadow-[3px_3px_0px_#113669] overflow-hidden shrink-0 bg-brand-grey">
                    {effectiveAvatar ? (
                      <img src={effectiveAvatar} alt="avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-blue/30">
                        <Image className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-brand-blue/50 leading-relaxed">
                    {activeTab === "google" && initialImage && <span className="text-emerald-600 font-bold">✓ Google photo selected</span>}
                    {activeTab === "custom" && customImageUrl && <span className="text-emerald-600 font-bold">✓ Custom photo uploaded</span>}
                    {activeTab === "preset" && <span className="text-brand-blue/50">Preset avatar selected</span>}
                  </div>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1.5">
                  {tabBtn("google", t.googlePfp, !!initialImage)}
                  {tabBtn("preset", t.avatarPreset, true)}
                  {tabBtn("custom", t.avatarCustom, true)}
                </div>

                {/* Tab content */}
                {activeTab === "google" && initialImage && (
                  <div className="p-4 border-2 border-brand-blue/20 bg-brand-bg/30 flex items-center gap-4">
                    <img src={initialImage} alt="Google profile" className="w-14 h-14 border-2 border-brand-orange shadow-[2px_2px_0px_#113669] object-cover" />
                    <div>
                      <p className="font-mono text-[10px] font-black text-brand-blue uppercase tracking-wide">{t.googlePfp}</p>
                      <p className="text-[10px] text-brand-blue/50 mt-0.5">{userEmail}</p>
                    </div>
                  </div>
                )}

                {activeTab === "preset" && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {PRESET_ICONS.map((iconPath, index) => {
                      const isSelected = selectedAvatar === iconPath;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedAvatar(iconPath)}
                          className={`aspect-square border-2 flex items-center justify-center p-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer relative ${
                            isSelected
                              ? "border-brand-orange bg-brand-orange/15 shadow-[3px_3px_0px_#113669] scale-105"
                              : "border-brand-blue bg-brand-grey/25 hover:border-brand-orange hover:bg-brand-white shadow-[1.5px_1.5px_0px_#113669]"
                          }`}
                        >
                          <img src={iconPath} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 bg-brand-orange border border-brand-blue text-brand-white text-[7px] font-black px-1 leading-tight">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeTab === "custom" && (
                  <div className="space-y-3 p-4 border-2 border-brand-blue/20 bg-brand-bg/30">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {customImageUrl ? (
                      <div className="flex items-center gap-3">
                        <img src={customImageUrl} alt="Custom upload" className="w-14 h-14 object-cover border-2 border-brand-orange shadow-[2px_2px_0px_#113669]" />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase">✓ Uploaded</span>
                          <button
                            type="button"
                            onClick={() => { setCustomImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="flex items-center gap-1 text-[9px] font-mono font-black text-rose-500 uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full py-4 border-2 border-dashed border-brand-blue/40 hover:border-brand-orange bg-brand-white hover:bg-brand-orange/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <Upload className="w-5 h-5 text-brand-blue/40 group-hover:text-brand-orange transition-colors" />
                        <span className="font-mono text-[9px] font-black uppercase tracking-wider text-brand-blue/50 group-hover:text-brand-orange transition-colors">
                          {uploading ? t.uploading : t.uploadBtn}
                        </span>
                        <span className="font-mono text-[8px] text-brand-blue/30">PNG, JPEG, WebP — max 5MB</span>
                      </button>
                    )}

                    {uploadError && (
                      <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {uploadError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 mt-4 text-start">
                <input
                  type="checkbox"
                  id="agree-onboarding-checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="mt-0.5 w-4 h-4 accent-brand-orange border-2 border-brand-blue rounded-none focus:ring-0 cursor-pointer"
                />
                <label htmlFor="agree-onboarding-checkbox" className="text-[10px] text-brand-blue/80 font-mono uppercase tracking-wider leading-normal select-none cursor-pointer">
                  {isRtl ? (
                    <>
                      أوافق على{" "}
                      <Link href="/legal?tab=terms" className="underline text-[#f58a2d] font-bold hover:text-brand-blue transition-colors">شروط الخدمة</Link>
                      {" "}و{" "}
                      <Link href="/legal?tab=privacy" className="underline text-[#f58a2d] font-bold hover:text-brand-blue transition-colors">سياسة الخصوصية</Link>
                      {" "}للمنصة.
                    </>
                  ) : (
                    <>
                      I agree to the{" "}
                      <Link href="/legal?tab=terms" className="underline text-[#f58a2d] font-bold hover:text-brand-blue transition-colors">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/legal?tab=privacy" className="underline text-[#f58a2d] font-bold hover:text-brand-blue transition-colors">Privacy Policy</Link>
                      .
                    </>
                  )}
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || uploading || !agreed}
                  className="w-full bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono font-bold py-4 px-6 rounded-none border-2 border-brand-blue uppercase text-xs tracking-widest transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(245,138,45,1)] hover:shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? t.loading : t.btnSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
