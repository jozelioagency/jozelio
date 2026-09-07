"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, RotateCcw } from "lucide-react";

export default function NotFound() {
  const [lang, setLang] = useState<"English" | "Arabic">("English");

  useEffect(() => {
    const savedLang = localStorage.getItem("jozelio_language");
    if (savedLang === "Arabic" || savedLang === "English") {
      setLang(savedLang);
    }
  }, []);

  const isRtl = lang === "Arabic";

  return (
    <div
      className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-brand-blue"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="bg-brand-white border-4 border-brand-blue p-8 md:p-12 shadow-[8px_8px_0px_#f58a2d] max-w-lg w-full text-center relative overflow-hidden">
        {/* Decorative corner stripes */}
        <div className="absolute top-0 right-0 w-24 h-6 bg-brand-orange transform rotate-45 translate-x-8 translate-y-3"></div>

        {/* Huge Brutalist Error Code */}
        <h1 className="font-display font-black text-7xl md:text-8xl tracking-tighter text-brand-blue uppercase">
          404
        </h1>

        {/* Secondary Title */}
        <h2 className="font-display font-black text-lg md:text-xl uppercase tracking-wide mt-4 border-2 border-brand-blue bg-brand-grey/40 py-2.5 px-4 shadow-[3px_3px_0px_#113669]">
          {isRtl ? "الصفحة غير موجودة" : "Page Not Found"}
        </h2>

        {/* Message */}
        <p className="text-xs md:text-sm font-medium text-brand-blue/70 leading-relaxed my-6 max-w-sm mx-auto">
          {isRtl
            ? "عذراً! الصفحة التي تبحث عنها قد تم نقلها أو أنها غير موجودة نهائياً. دعنا نساعدك في العودة للمسار الصحيح."
            : "Oops! The page you are looking for does not exist, has been removed, or is temporarily unavailable."}
        </p>

        {/* Quick Actions Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mt-8">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-6 border-2 border-brand-blue bg-brand-orange hover:bg-brand-blue text-brand-blue hover:text-brand-white font-mono text-xs uppercase font-black tracking-widest transition-all shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#113669] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isRtl ? "الذهاب للمركز" : "Back to Hub"}</span>
          </Link>

          <Link
            href="/"
            className="flex-1 py-3 px-6 border-2 border-brand-blue bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-xs uppercase font-black tracking-widest transition-all shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#113669] flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isRtl ? "الصفحة الرئيسية" : "Main Home"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
