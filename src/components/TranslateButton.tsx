"use client";

import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";

export default function TranslateButton() {
  const [lang, setLang] = useState<"English" | "Arabic">("English");

  useEffect(() => {
    // Read from localStorage on mount
    const savedLang = localStorage.getItem("jozelio_language");
    if (savedLang === "Arabic" || savedLang === "English") {
      setLang(savedLang);
      const isRtl = savedLang === "Arabic";
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = isRtl ? "ar" : "en";

      // Set cookie if missing
      if (!document.cookie.includes("jozelio_language")) {
        const hostname = window.location.hostname;
        const domain = hostname.includes("jozelio.dev") ? ".jozelio.dev" : ".jozelio.com";
        document.cookie = `jozelio_language=${savedLang}; domain=${domain}; path=/; max-age=31536000`;
      }
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "English" ? "Arabic" : "English";
    setLang(nextLang);
    localStorage.setItem("jozelio_language", nextLang);

    // Set cross-subdomain cookie for i18n
    const hostname = window.location.hostname;
    const domain = hostname.includes("jozelio.dev") ? ".jozelio.dev" : ".jozelio.com";
    document.cookie = `jozelio_language=${nextLang}; domain=${domain}; path=/; max-age=31536000`;

    const isRtl = nextLang === "Arabic";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = isRtl ? "ar" : "en";

    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 border border-brand-blue/30 bg-brand-white hover:border-brand-blue hover:bg-brand-blue/5 px-3 py-1.5 font-mono text-[10px] uppercase font-bold text-brand-blue transition-all cursor-pointer group shadow-[1.5px_1.5px_0px_#113669]"
      title="Toggle Interface Language / Direction"
    >
      <Globe className="w-3.5 h-3.5 text-brand-orange group-hover:animate-spin-slow" />
      <span>{lang === "English" ? "EN" : "AR"}</span>
    </button>
  );
}
