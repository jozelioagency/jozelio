"use client";

import React, { useState } from "react";
import { Download, Globe, ExternalLink, QrCode } from "lucide-react";

interface Tenant {
  id: string;
  businessName: string;
  subdomain: string;
}

interface QrClientProps {
  tenant: Tenant;
  lang?: string;
}

const qrTranslations = {
  English: {
    title: "Storefront QR Code",
    subtitle: "Generate and download a custom QR code for your customer storefront.",
    qrCardSec: "QR Code Generator",
    qrCardSub: "Scan this code with a phone to visit your online store storefront instantly.",
    storefrontUrlLabel: "Storefront Link",
    downloadBtn: "Download QR Image",
    downloading: "Downloading...",
    visitBtn: "Visit Storefront",
  },
  Arabic: {
    title: "رمز الاستجابة السريعة (QR)",
    subtitle: "توليد وتنزيل رمز QR مخصص لمتجر عملائك الرقمي.",
    qrCardSec: "مولد رمز QR",
    qrCardSub: "امسح هذا الرمز بكاميرا الهاتف لزيارة متجرك الإلكتروني مباشرة.",
    storefrontUrlLabel: "رابط المتجر",
    downloadBtn: "تحميل صورة الـ QR",
    downloading: "جاري التحميل...",
    visitBtn: "زيارة المتجر",
  },
};

export default function QrClient({ tenant, lang = "English" }: QrClientProps) {
  const [downloading, setDownloading] = useState(false);
  const t = qrTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";

  const storefrontUrl = `http://${tenant.subdomain}.jozelio.dev:3000?source=qr`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(storefrontUrl)}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${tenant.subdomain}-storefront-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download QR code", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 text-start" dir={isRtl ? "rtl" : "ltr"}>
      {/* Page Title */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669]">
        <h2 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">
          {t.title}
        </h2>
        <p className="text-brand-blue/70 text-xs mt-1 font-medium">
          {t.subtitle}
        </p>
      </div>

      {/* QR Main Card */}
      <div className="bg-brand-white border-2 border-brand-blue p-8 shadow-[6px_6px_0px_0px_#f58a2d] flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
        {/* Decorative corner stripes */}
        <div className="absolute top-0 right-0 w-16 h-4 bg-brand-orange transform rotate-45 translate-x-5 translate-y-2 pointer-events-none"></div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="p-4 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669] relative group">
            <img
              src={qrCodeUrl}
              alt="Storefront QR Code"
              className="w-48 h-48 object-contain"
            />
          </div>
          <span className="font-mono text-[9px] font-black text-brand-orange uppercase tracking-wider bg-brand-blue/5 border border-brand-blue/10 px-2 py-0.5 mt-1">
            PNG 300X300px
          </span>
        </div>

        {/* Details & Actions Box */}
        <div className="flex-1 flex flex-col gap-5 text-start w-full">
          <div>
            <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>{t.qrCardSec}</span>
            </h3>
            <p className="text-brand-blue/60 text-[11px] font-medium leading-relaxed">
              {t.qrCardSub}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
              {t.storefrontUrlLabel}
            </label>
            <div className="flex items-center gap-2 p-2 border-2 border-brand-blue bg-brand-grey/20 text-xs font-mono font-bold text-brand-blue overflow-x-auto truncate max-w-full">
              <Globe className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              <span className="truncate">{storefrontUrl}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 h-11 bg-brand-orange hover:bg-brand-blue text-brand-blue hover:text-brand-white font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{downloading ? t.downloading : t.downloadBtn}</span>
            </button>

            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>{t.visitBtn}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
