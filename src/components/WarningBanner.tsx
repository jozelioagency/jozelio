"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface WarningBannerProps {
  warningReason: string | null;
  username: string;
  projectId: string;
}

export default function WarningBanner({ warningReason, username, projectId }: WarningBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if this specific warning was already dismissed
    const warningKey = warningReason || "default_warning";
    const isDismissed = localStorage.getItem(`warning_dismissed_${btoa(warningKey)}`);
    if (isDismissed === "true") {
      setIsVisible(false);
    }
  }, [warningReason]);

  const handleDismiss = () => {
    setIsVisible(false);
    const warningKey = warningReason || "default_warning";
    localStorage.setItem(`warning_dismissed_${btoa(warningKey)}`, "true");
  };

  if (!isVisible) return null;

  const whatsappMessage = `Hello, I believe the warning on my account is a mistake. Could you please review it?\nUsername: ${username}\nProject ID: ${projectId}`;
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201000000000";
  // wa.me requires the number to start with + country code
  const formattedNumber = whatsappNumber.startsWith("+") ? whatsappNumber : `+${whatsappNumber}`;
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-amber-50 border-4 border-brand-blue p-4 mb-6 flex gap-3 items-start text-start shadow-[4px_4px_0px_#113669] relative group animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
      <div className="flex-grow pr-6">
        <h4 className="font-display font-black text-xs text-brand-blue uppercase tracking-wide">
          Storefront Warning Notice
        </h4>
        <p className="text-[11px] font-semibold text-brand-blue/80 mt-1">
          {warningReason || "A warning has been placed on this project. Please review policy requirements."}
        </p>
        <p className="text-[11px] font-semibold text-brand-blue/80 mt-1">
          If you believe this is a mistake,{" "}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:text-brand-blue hover:underline font-bold transition-colors"
          >
            contact us
          </a>.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 border-2 border-brand-blue/10 hover:border-brand-blue bg-transparent hover:bg-brand-white text-brand-blue/60 hover:text-rose-600 transition-all cursor-pointer hover:shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        title="Dismiss Warning"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
