"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, Sparkles, Send, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "./BrandLogo";
import TranslateButton from "./TranslateButton";
import Link from "next/link";

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  selectedLanguage?: string | null;
  onAuthClick?: (mode: "signup" | "signin") => void;
  t: {
    home: string;
    services: string;
    estimator: string;
    benefitBtn: string;
    sectorLabel: string;
    menuLabel: string;
    langRegion: string;
  };
}

// Snappy, high-end motion configurations for the mobile menu dropdown
const menuVariants = {
  closed: {
    opacity: 0,
    height: 0,
    y: -8,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
      when: "afterChildren",
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0] as [number, number, number, number]
    }
  },
  open: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
    }
  }
};

const itemVariants = {
  closed: { opacity: 0, x: -16, y: -6 },
  open: { 
    opacity: 1, 
    x: 0, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 280, 
      damping: 22 
    } 
  }
};

export default function Navbar({ 
  activeSection, 
  onNavigate, 
  selectedLanguage,
  onAuthClick,
  t
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: { label: string; id: string; highlight?: boolean }[] = [
    { label: t.home, id: "home" },
    { label: t.estimator, id: "estimator" },
    { label: t.services, id: "services" },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      id="jozelio-navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-brand-bg/95 backdrop-blur-md border-b-2 border-brand-blue py-3 shadow-md"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo - Sharp Bold Style */}
        <button
          onClick={() => handleItemClick("home")}
          className="flex items-center group cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <BrandLogo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex flex-wrap justify-center items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-brand-blue/80">
          <Link className="hover:text-brand-orange transition-colors font-bold" href="/legal?tab=terms">Terms of Service</Link>
          <Link className="hover:text-brand-orange transition-colors font-bold" href="/legal?tab=privacy">Privacy Policy</Link>
          <Link className="hover:text-brand-orange transition-colors font-bold" href="/legal?tab=cookies">Cookie Policy</Link>
        </div>

        {/* Action Buttons & Sector Indicator (Desktop) */}
        <div className="hidden lg:flex items-center space-x-3">
          <TranslateButton />

          <button
            onClick={() => onAuthClick?.("signin")}
            className="px-4 py-2.5 font-mono text-[11px] uppercase font-bold tracking-widest text-brand-blue hover:text-brand-orange transition-colors cursor-pointer focus:outline-none"
          >
            Sign In
          </button>

          <button
            onClick={() => onAuthClick?.("signup")}
            className="group flex items-center space-x-2 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[11px] font-bold uppercase tracking-[0.15em] px-5 py-3 rounded-none border border-brand-blue transition-all duration-300 cursor-pointer"
          >
            <span>{t.benefitBtn}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Mobile Menu Button with animations */}
        <div className="lg:hidden flex items-center space-x-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-brand-blue hover:text-brand-orange focus:outline-none p-3 rounded-none border-2 border-brand-blue bg-brand-white cursor-pointer relative transition-colors duration-300 active:scale-95"
            aria-label="Toggle Menu"
          >
            <div className="w-5 h-4.5 relative flex flex-col justify-between items-end">
              <motion.span
                variants={{
                  closed: { width: "100%", y: 0, rotate: 0 },
                  open: { width: "100%", y: 8, rotate: 45 }
                }}
                animate={isMobileMenuOpen ? "open" : "closed"}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-[2px] bg-current block rounded-full"
              />
              <motion.span
                variants={{
                  closed: { width: "65%", opacity: 1, scaleX: 1 },
                  open: { width: "0%", opacity: 0, scaleX: 0 }
                }}
                animate={isMobileMenuOpen ? "open" : "closed"}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="h-[2px] bg-current block rounded-full"
              />
              <motion.span
                variants={{
                  closed: { width: "100%", y: 0, rotate: 0 },
                  open: { width: "100%", y: -8, rotate: -45 }
                }}
                animate={isMobileMenuOpen ? "open" : "closed"}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-[2px] bg-current block rounded-full"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown with slide and stagger animations */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-[73px] bg-brand-blue/15 backdrop-blur-sm z-40 lg:hidden"
            />

            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="lg:hidden bg-brand-white border-b-4 border-brand-blue py-8 px-6 absolute top-full left-0 w-full shadow-2xl z-50 text-brand-blue overflow-hidden"
            >
              <div className="flex flex-col space-y-3">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    variants={itemVariants}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full text-left px-5 py-4 rounded-none font-mono text-[11px] uppercase tracking-wider flex items-center justify-between transition-all duration-300 border-2 relative overflow-hidden group ${
                      activeSection === item.id
                        ? "bg-brand-blue text-brand-white border-brand-blue font-black"
                        : "text-brand-blue hover:text-brand-orange hover:bg-brand-blue/5 border-transparent hover:border-brand-blue/10"
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold ${activeSection === item.id ? "text-brand-orange animate-pulse" : "text-brand-blue/40"}`}>
                        0{index + 1}
                      </span>
                      <span className="font-bold">{item.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {activeSection === item.id && (
                        <motion.span 
                          layoutId="activeIndicator"
                          className="w-1.5 h-1.5 bg-brand-orange rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      )}
                      <ArrowUpRight className={`w-4 h-4 transition-transform duration-300 ${
                        activeSection === item.id 
                          ? "text-brand-orange translate-x-0.5 -translate-y-0.5" 
                          : "opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      }`} />
                    </div>
                  </motion.button>
                ))}                 <motion.div 
                  variants={itemVariants}
                  className="pt-6 mt-4 border-t-2 border-brand-blue/15 space-y-3.5"
                >


                  <div className="flex justify-center py-2">
                    <TranslateButton />
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onAuthClick?.("signin");
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-[10px] uppercase font-bold tracking-wider py-4 rounded-none border-2 border-brand-blue transition-all duration-300 cursor-pointer"
                  >
                    <span>Sign In</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onAuthClick?.("signup");
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase font-bold tracking-wider py-4 rounded-none border-2 border-brand-blue transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(245,138,45,1)] hover:shadow-none cursor-pointer"
                  >
                    <span>{t.benefitBtn}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
