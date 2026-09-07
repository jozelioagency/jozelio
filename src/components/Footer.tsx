"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowUpRight, Mail, Globe, Clock } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { translations } from "@/app/translations";

interface FooterProps {
  onNavigate?: (sectionId: string) => void;
  t?: {
    desc: string;
    navHeading: string;
    contactHeading: string;
    labelInquiries: string;
    labelHub: string;
    labelHours: string;
    valueHub: string;
    valueHours: string;
    copyright: string;
    privacyTerms: string;
    cookieSetup: string;
    backToTop: string;
  };
}

export default function Footer({ onNavigate, t }: FooterProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("jozelio_language") || "English";
    setSelectedLanguage(savedLanguage);
  }, []);

  const currentLang = selectedLanguage || "English";
  const translationsMatrix = translations[currentLang] || translations["English"];
  const finalT = t || translationsMatrix.footer;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigate = (sectionId: string) => {
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - 80;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      } else {
        window.location.href = `/#${sectionId}`;
      }
    }
  };

  const isPolish = finalT.privacyTerms === "Polityka prywatności";
  const isArabic = finalT.privacyTerms === "شروط الخصوصية";

  const homeLabel = isPolish ? "Główna" : isArabic ? "الرئيسية" : "Home";
  const servicesLabel = isPolish ? "Usługi" : isArabic ? "الخدمات" : "Core Services";
  const formLabel = isPolish ? "Formularz" : isArabic ? "النموذج" : "Inquiry Form";

  // Dynamic system status values
  const statusOnline = isPolish 
    ? "SYSTEMY OPERACYJNE: AKTYWNE" 
    : isArabic 
      ? "الأنظمة التشغيلية: نشطة" 
      : "OPERATIONAL SYSTEMS: ACTIVE";

  const ctaLabel = isPolish
    ? "Rozpocznij Projekt"
    : isArabic
      ? "ابدأ مشروعك"
      : "Launch A Project";

  return (
    <footer id="footer" className="bg-brand-bg pt-0 pb-12 border-t-2 border-brand-blue relative overflow-hidden">
      {/* 1. High-End Status Ticker Bar */}
      <div className="border-b border-brand-blue/20 bg-brand-white/40 backdrop-blur-sm py-4 mb-2">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] font-bold text-brand-blue uppercase tracking-widest">
              {statusOnline}
            </span>
          </div>
          <button 
            onClick={() => handleNavigate("estimator")}
            className="group flex items-center gap-1.5 font-mono text-[10px] font-black text-brand-blue hover:text-brand-orange uppercase tracking-widest transition-colors cursor-pointer"
          >
            <span>{ctaLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* 2. Modular Brutalist Info Cells */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-brand-blue/20 text-start">
          {/* Cell A: Brand Descriptor */}
          <div className="lg:col-span-5 py-12 pr-6 lg:border-r border-brand-blue/20 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <button
                onClick={() => handleNavigate("home")}
                className="flex items-center group cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <BrandLogo size="md" />
              </button>
              <p className="text-sm text-brand-blue/80 max-w-sm leading-relaxed font-medium">
                {finalT.desc}
              </p>
            </div>

            {/* Custom Monospace Social Grid */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "INSTAGRAM", href: "#", code: "IG" },
                { label: "LINKEDIN", href: "#", code: "LI" },
                { label: "TWITTER", href: "#", code: "TW" },
                { label: "FACEBOOK", href: "https://web.facebook.com/profile.php?id=61591511981185", code: "FB" }
              ].map((social) => (
                <a
                  key={social.code}
                  href={social.href}
                  className="group relative inline-flex items-center gap-2 px-3 py-1.5 border border-brand-blue/20 hover:border-brand-blue hover:bg-brand-blue hover:text-brand-white text-brand-blue text-[10px] font-mono font-bold uppercase transition-all duration-200"
                  title={social.label}
                >
                  <span className="text-brand-orange group-hover:text-brand-white transition-colors">[{social.code}]</span>
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </div>


          {/* Cell C: Intel & Contact Coordinates */}
          <div className="lg:col-span-4 py-12 pl-6 space-y-6">
            <div className="font-mono text-[9px] font-bold text-brand-blue/40 uppercase tracking-widest">
              02 // {finalT.contactHeading}
            </div>
            <div className="space-y-5">
              <a 
                href="mailto:growth@jozelio.com" 
                className="group block p-4 border border-brand-blue/15 hover:border-brand-blue bg-brand-white/30 hover:bg-brand-white transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none border border-brand-blue/25 group-hover:border-brand-blue flex items-center justify-center text-brand-blue/60 group-hover:text-brand-orange transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-mono text-[8px] text-brand-blue/50 uppercase tracking-widest">{finalT.labelInquiries}</span>
                    <span className="font-mono text-xs font-black text-brand-blue">growth@jozelio.com</span>
                  </div>
                </div>
              </a>

              <div className="p-4 border border-brand-blue/15 bg-brand-white/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-none border border-brand-blue/25 flex items-center justify-center text-brand-blue/40">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-mono text-[8px] text-brand-blue/50 uppercase tracking-widest">{finalT.labelHub}</span>
                  <span className="text-xs font-bold text-brand-blue leading-tight block">{finalT.valueHub}</span>
                </div>
              </div>

              <div className="p-4 border border-brand-blue/15 bg-brand-white/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-none border border-brand-blue/25 flex items-center justify-center text-brand-blue/40">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-mono text-[8px] text-brand-blue/50 uppercase tracking-widest">{finalT.labelHours}</span>
                  <span className="text-xs font-bold text-brand-blue leading-tight block">{finalT.valueHours}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Giant Background Typography Accent */}
        <div className="w-full text-center py-4 select-none pointer-events-none overflow-hidden my-4">
          <span className="font-display font-black text-[13vw] sm:text-[14vw] leading-none text-brand-blue/[0.025] uppercase tracking-tighter block select-none">
            JOZELIO
          </span>
        </div>

        {/* 4. Bottom Row */}
        <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-brand-blue/60 font-medium font-mono uppercase tracking-wider">
          <span>
            {finalT.copyright}
          </span>
          <div className="flex flex-wrap justify-center items-center gap-6">
            <Link href="/legal?tab=terms" className="hover:text-brand-orange transition-colors font-bold">
              {isArabic ? "شروط الخدمة" : isPolish ? "Regulamin" : "Terms of Service"}
            </Link>
            <Link href="/legal?tab=privacy" className="hover:text-brand-orange transition-colors font-bold">
              {isArabic ? "سياسة الخصوصية" : isPolish ? "Polityka prywatności" : "Privacy Policy"}
            </Link>
            <Link href="/legal?tab=cookies" className="hover:text-brand-orange transition-colors font-bold">
              {isArabic ? "ملفات تعريف الارتباط" : isPolish ? "Pliki cookies" : "Cookie Policy"}
            </Link>
            <Link href="/legal?tab=disclaimer" className="hover:text-brand-orange transition-colors font-bold">
              {isArabic ? "إخلاء المسؤولية" : isPolish ? "Wyłączenie odpowiedzialności" : "Disclaimer"}
            </Link>
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-1.5 hover:text-brand-orange transition-colors focus:outline-none cursor-pointer font-bold border-l border-brand-blue/20 pl-6"
            >
              <span>{finalT.backToTop}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
