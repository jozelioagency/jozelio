"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { registerUser, getEmailByUsername } from "@/app/actions";
import { signIn } from "@/lib/auth-client";
import { User, Briefcase, Globe, Mail, Lock, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import CountrySelect from "./CountrySelect";

interface AuthSectionProps {
  selectedLanguage?: string | null;
  activeMode?: "signup" | "signin";
  onModeChange?: (mode: "signup" | "signin") => void;
}

const translations = {
  English: {
    badge: "04 / Instant Setup",
    title: "Create Your Account",
    desc: "Join Jozelio today. Create your generic profile in seconds and unlock our universal dashboard and activation suite.",
    formHeading: "Get Started Now",
    formSubheading: "Configure your name and credentials below",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    usernameLabel: "Username",
    usernamePlace: "Please enter your username here...",
    signUp: "Register Account",
    signIn: "Sign In",
    haveAccount: "Already have an account? Sign In",
    noAccount: "Don't have an account? Sign Up",
    loading: "PROCESSING REQUEST...",
    errorOccurred: "An error occurred. Please try again.",
    successSignUp: "Account created successfully! Please sign in to access your universal dashboard.",
    successSignIn: "Logged in successfully! Redirecting to dashboard...",
    googleSignIn: "Continue with Google",
  },
  Arabic: {
    badge: "04 / إعداد فوري",
    title: "أنشئ حسابك الخاص",
    desc: "انضم إلى جوزيليو اليوم. أنشئ حسابك الشخصي في ثوانٍ معدودة للوصول إلى لوحة التحكم الموحدة وسوق تفعيل الخدمات.",
    formHeading: "ابدأ الآن مجاناً",
    formSubheading: "أدخل الاسم وبيانات الاعتماد أدناه",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    usernameLabel: "اسم المستخدم",
    usernamePlace: "الرجاء إدخال اسم المستخدم هنا...",
    signUp: "إنشاء حساب جديد",
    signIn: "تسجيل الدخول",
    haveAccount: "لديك حساب بالفعل؟ تسجيل الدخول",
    noAccount: "ليس لديك حساب؟ إنشاء حساب",
    loading: "جاري معالجة الطلب...",
    errorOccurred: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    successSignUp: "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول للوصول إلى لوحة التحكم.",
    successSignIn: "تم تسجيل الدخول بنجاح! جاري التوجيه إلى لوحة التحكم...",
    googleSignIn: "المتابعة باستخدام جوجل",
  }
};

export default function AuthSection({ selectedLanguage, activeMode, onModeChange }: AuthSectionProps) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Turnstile state and ref
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<any>(null);
  const [country, setCountry] = useState<string>("Egypt");
  const [agreed, setAgreed] = useState<boolean>(false);

  // Sync mode when parent updates it
  useEffect(() => {
    if (activeMode) {
      setMode(activeMode);
      setMessage(null);
    }
  }, [activeMode]);

  const handleGoogleSignIn = async () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await signIn.social({
          provider: "google",
          callbackURL: "/dashboard",
        });
        if (res?.error) {
          setMessage({ type: "error", text: res.error.message || t.errorOccurred });
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err?.message || t.errorOccurred });
      }
    });
  };

  const currentLang = selectedLanguage || "English";
  const t = (translations as any)[currentLang] || translations["English"];
  const isRtl = currentLang === "Arabic";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Append turnstile token to registration payloads
    if (mode === "signup") {
      data["turnstileToken"] = turnstileToken;
    }

    startTransition(async () => {
      if (mode === "signup") {
        if (!agreed) {
          setMessage({ type: "error", text: isRtl ? "يجب الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة." : "You must agree to the Terms of Service and Privacy Policy to register." });
          return;
        }
        const res = await registerUser(data);
        if (res?.error) {
          setMessage({ type: "error", text: res.error });
          turnstileRef.current?.reset();
        } else {
          setMessage({ type: "success", text: t.successSignUp });
          setMode("signin");
          turnstileRef.current?.reset();
        }
      } else {
        try {
          let email = data.identifier;
          if (!email) {
            setMessage({ type: "error", text: isRtl ? "الرجاء إدخال البريد الإلكتروني أو اسم المستخدم" : "Email or username is required" });
            return;
          }

          if (!email.includes("@")) {
            const resolveRes = await getEmailByUsername(email);
            if (resolveRes.error) {
              setMessage({ type: "error", text: resolveRes.error });
              turnstileRef.current?.reset();
              return;
            }
            email = resolveRes.email!;
          }

          const res = await signIn.email({
            email,
            password: data.password,
            callbackURL: "/dashboard",
            fetchOptions: {
              headers: {
                "x-turnstile-token": turnstileToken,
              },
            },
          });
          if (res?.error) {
            setMessage({ type: "error", text: res.error.message || t.errorOccurred });
            turnstileRef.current?.reset();
          } else {
            setMessage({ type: "success", text: t.successSignIn });
            window.location.href = "/dashboard";
          }
        } catch (err: any) {
          setMessage({ type: "error", text: err?.message || t.errorOccurred });
          turnstileRef.current?.reset();
        }
      }
    });
  };

  return (
    <section id="estimator" className="py-24 bg-brand-bg border-t-2 border-brand-blue relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Dynamic background decorations */}
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 
            className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-brand-blue uppercase tracking-tighter leading-none"
            style={{ textShadow: "1px 1px 0px #f58a2d, 2px 2px 0px #f58a2d, 3px 3px 0px #f58a2d" }}
          >
            {t.title}
          </h2>
          <p className="text-brand-blue/80 text-sm leading-relaxed max-w-xl mx-auto font-medium">
            {t.desc}
          </p>
        </div>

        {/* Centered Brutalist Signup/Login Card */}
        <div className="max-w-2xl mx-auto bg-brand-white border-2 border-brand-blue rounded-none p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(245,138,45,1)] text-brand-blue relative">
          {/* Corner highlights */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-orange -translate-x-1 -translate-y-1" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-orange translate-x-1 -translate-y-1" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-orange -translate-x-1 translate-y-1" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-orange translate-x-1 translate-y-1" />

          <div className="space-y-6">
            {/* Header info */}
            <div className="border-b-2 border-brand-blue pb-4">
              <h3 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">{mode === "signup" ? t.signUp : t.signIn}</h3>
              <p className="text-xs text-brand-blue/60 font-mono uppercase tracking-wider">{t.formSubheading}</p>
            </div>

            {/* Tabs Selector */}
            <div className="flex gap-4 border-b border-brand-blue/10 pb-3 mb-2 font-mono text-xs font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                  onModeChange?.("signup");
                }}
                className={`pb-1 transition-all cursor-pointer ${
                  mode === "signup"
                    ? "text-[#f58a2d] border-b-2 border-[#f58a2d]"
                    : "text-brand-blue/50 hover:text-brand-blue"
                }`}
              >
                {t.signUp}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setMessage(null);
                  onModeChange?.("signin");
                }}
                className={`pb-1 transition-all cursor-pointer ${
                  mode === "signin"
                    ? "text-[#f58a2d] border-b-2 border-[#f58a2d]"
                    : "text-brand-blue/50 hover:text-brand-blue"
                }`}
              >
                {t.signIn}
              </button>
            </div>

            {/* Notification messages */}
            {message && (
              <div
                className={`p-4 text-xs font-bold flex items-start gap-2 border-2 ${
                  message.type === "success"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-rose-50 border-rose-500 text-rose-800"
                }`}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {message.type === "success" ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </span>
                <p className="leading-relaxed">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} method="POST" className="space-y-5">
              {mode === "signup" && (
                <>
                  <div className="space-y-1 text-start">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                      {t.fullName}
                    </label>
                    <div className="relative">
                      <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder={isRtl ? "الرجاء إدخال الاسم الكامل هنا..." : "ENTER FULL NAME HERE"}
                        className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3.5 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-start">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                      {t.usernameLabel}
                    </label>
                    <div className="relative">
                      <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        name="username"
                        type="text"
                        required
                        pattern="^[a-z0-9_-]{3,20}$"
                        title="Username must be 3-20 characters and contain only lowercase letters, numbers, hyphens, and underscores."
                        placeholder={t.usernamePlace}
                        onChange={(e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""); }}
                        className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3.5 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-start">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                      {isRtl ? "اختر الدولة / المنطقة" : "Country / Region"}
                    </label>
                    <CountrySelect value={country} onChange={setCountry} lang={currentLang} isRtl={isRtl} />
                  </div>
                </>
              )}

               {mode === "signin" ? (
                <div className="space-y-1 text-start">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                    {isRtl ? "البريد الإلكتروني أو اسم المستخدم" : "Email or Username"}
                  </label>
                  <div className="relative">
                    <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      name="identifier"
                      type="text"
                      required
                      placeholder={isRtl ? "الرجاء إدخال البريد الإلكتروني أو اسم المستخدم هنا..." : "ENTER EMAIL OR USERNAME HERE"}
                      className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3.5 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-start">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                    {t.email}
                  </label>
                  <div className="relative">
                    <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder={isRtl ? "الرجاء إدخال البريد الإلكتروني هنا..." : "ENTER EMAIL HERE"}
                      className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3.5 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-semibold`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 text-start">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-blue/60 font-bold">
                  {t.password}
                </label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-orange`}>
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder={isRtl ? "الرجاء إدخال كلمة المرور هنا..." : "ENTER PASSWORD HERE"}
                    className={`w-full bg-brand-bg/25 border-2 border-brand-blue rounded-none ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} py-3.5 text-sm text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange transition-all font-mono font-semibold`}
                  />
                </div>
              </div>

              {/* Invisible Cloudflare Turnstile bot verification */}
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                options={{
                  size: "invisible",
                }}
                onSuccess={(token) => setTurnstileToken(token)}
              />

              {mode === "signup" && (
                <div className="flex items-start gap-2.5 mb-4 text-start">
                  <input
                    type="checkbox"
                    id="agree-signup-checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                    className="mt-0.5 w-4 h-4 accent-brand-orange border-2 border-brand-blue rounded-none focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="agree-signup-checkbox" className="text-[10px] text-brand-blue/80 font-mono uppercase tracking-wider leading-normal select-none cursor-pointer">
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
              )}

              <button
                type="submit"
                disabled={isPending || (mode === "signup" && !agreed)}
                className="w-full bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono font-bold py-4 px-6 rounded-none border-2 border-brand-blue uppercase text-xs tracking-widest transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(245,138,45,1)] hover:shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? t.loading : mode === "signup" ? t.signUp : t.signIn}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-brand-blue/10"></div>
                <span className="flex-shrink mx-4 text-brand-blue/30 font-mono text-[9px] uppercase font-black tracking-widest">{isRtl ? "أو" : "OR"}</span>
                <div className="flex-grow border-t border-brand-blue/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isPending}
                className="w-full h-12 bg-brand-white hover:bg-brand-orange hover:text-brand-blue text-brand-blue font-mono font-bold px-6 rounded-none border-2 border-brand-blue uppercase text-xs tracking-widest transition-all duration-300 shadow-[3px_3px_0px_0px_#113669] hover:shadow-none flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{t.googleSignIn}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newMode = mode === "signup" ? "signin" : "signup";
                  setMode(newMode);
                  setMessage(null);
                  onModeChange?.(newMode);
                }}
                className="w-full font-mono text-[9px] uppercase tracking-wider font-bold text-[#f58a2d] hover:underline text-center cursor-pointer block mt-2"
              >
                {mode === "signup" ? t.haveAccount : t.noAccount}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
