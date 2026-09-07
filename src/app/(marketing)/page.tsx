"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HomeHero from "@/components/HomeHero";
import ServicesGrid from "@/components/ServicesGrid";
import AuthSection from "@/components/AuthSection";
import Footer from "@/components/Footer";

import { translations } from "@/app/translations";

export default function MarketingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Authentication Section States
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  // Check if language selection exists in localStorage on startup
  useEffect(() => {
    const savedLanguage = localStorage.getItem("jozelio_language") || "English";
    setSelectedLanguage(savedLanguage);
  }, []);

  // Smooth scroll helper
  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      // Offset scroll to account for fixed navbar height (~80px)
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 80;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Dynamically update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "estimator", "services"];
      const scrollPosition = window.scrollY + 200; // Offset value for trigger precision

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthClick = (mode: "signup" | "signin") => {
    setAuthMode(mode);
    const element = document.getElementById("estimator");
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 80;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const currentLang = selectedLanguage || "English";
  const t = translations[currentLang] || translations["English"];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-brand-bg text-brand-blue font-sans selection:bg-brand-orange/30 selection:text-brand-orange">
      {/* Decorative Brand Light Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-brand-blue/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-brand-orange/[0.04] blur-[150px]" />
      </div>

      {/* Floating Interactive Command Hub */}
      <div className="relative z-10 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Navigation Bar */}
        <Navbar 
          activeSection={activeSection} 
          onNavigate={handleNavigate} 
          selectedLanguage={selectedLanguage}
          onAuthClick={handleAuthClick}
          t={t.navbar}
        />

        {/* Home Hero Introduction */}
        <HomeHero 
          onNavigate={handleNavigate} 
          onAuthClick={handleAuthClick}
          t={t.hero} 
          selectedLanguage={currentLang} 
        />

        {/* Direct Authentication Section */}
        <AuthSection 
          selectedLanguage={selectedLanguage} 
          activeMode={authMode}
          onModeChange={setAuthMode}
        />

        {/* Agency Services & Deliverables */}
        <ServicesGrid t={t.servicesGrid} />

        {/* Agency Footer */}
        <Footer onNavigate={handleNavigate} t={t.footer} />
      </div>
    </div>
  );
}
