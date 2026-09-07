"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, Settings, User, ChevronRight } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import Link from "next/link";

interface LogoutButtonProps {
  variant: "sidebar" | "header";
  lang?: string;
}

const logoutTranslations = {
  English: {
    exit: "Exit",
    settings: "Settings",
    profile: "Profile",
    logout: "Log Out",
    confirmTitle: "Are you sure you want to log out?",
    confirmDesc: "You will be signed out of your current session and returned to the landing page.",
    yes: "Yes, Log Out",
    no: "Cancel",
  },
  Arabic: {
    exit: "خروج",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    confirmTitle: "هل أنت متأكد من تسجيل الخروج؟",
    confirmDesc: "سيتم تسجيل خروجك من الجلسة الحالية وإعادتك إلى الصفحة الرئيسية.",
    yes: "نعم، خروج",
    no: "إلغاء",
  },
};

export default function LogoutButton({ variant, lang = "English" }: LogoutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = logoutTranslations[lang === "Arabic" ? "Arabic" : "English"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleConfirmLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  const handleClose = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {variant === "sidebar" ? (
        <div className="relative" ref={menuRef}>
          {/* Settings trigger button */}
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 border border-transparent hover:border-brand-blue hover:bg-brand-blue/5 text-brand-blue/60 hover:text-brand-blue transition-all font-mono text-xs cursor-pointer focus:outline-none z-10"
            type="button"
            title={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute bottom-full mb-2 right-0 w-44 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_0px_rgba(245,138,45,1)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <Link
                href="/profile"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue hover:text-brand-white transition-colors group border-b border-brand-blue/10"
              >
                <User className="w-3.5 h-3.5 text-brand-orange group-hover:text-brand-white transition-colors" />
                <span>{t.profile}</span>
                <ChevronRight className="w-3 h-3 ml-auto opacity-40 group-hover:opacity-100" />
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowConfirm(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-brand-blue hover:bg-rose-500 hover:text-brand-white transition-colors group cursor-pointer focus:outline-none"
                type="button"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:text-brand-white transition-colors" />
                <span>{t.logout}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setShowConfirm(true);
          }}
          className="p-2 border border-brand-blue/30 text-brand-blue/60 hover:text-rose-600 hover:border-rose-500 hover:bg-rose-50 transition-all font-mono text-xs cursor-pointer flex items-center gap-1.5 font-bold focus:outline-none z-10"
          type="button"
          title="Log Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline uppercase text-[9px] tracking-wider">{t.exit}</span>
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-blue/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[5px_5px_0px_#f58a2d] max-w-sm w-full text-brand-blue relative animate-in zoom-in-95 duration-200">
            <h3 className="font-display font-black text-lg uppercase tracking-tight mb-2">
              {t.confirmTitle}
            </h3>
            <p className="text-xs text-brand-blue/70 leading-relaxed mb-6 font-medium">
              {t.confirmDesc}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2 border-2 border-brand-blue bg-rose-500 hover:bg-brand-blue text-brand-white font-mono text-[10px] uppercase tracking-wider font-black transition-all shadow-[2px_2px_0px_#113669] cursor-pointer"
              >
                {t.yes}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2 border-2 border-brand-blue bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-[10px] uppercase tracking-wider font-black transition-all shadow-[2px_2px_0px_#113669] cursor-pointer"
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
