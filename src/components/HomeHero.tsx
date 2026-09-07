"use client";

import React from "react";
import { Globe, Monitor, Share2, TrendingUp, Zap, ArrowRight, ArrowDown } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

interface HomeHeroProps {
  onNavigate: (sectionId: string) => void;
  selectedLanguage?: string;
  onAuthClick?: (mode: "signup" | "signin") => void;
  t: {
    bgAgency: string;
    headlineStart: string;
    headlineMid: string;
    headlineMid2: string;
    headlineEnd: string;
    paragraph: string;
    ctaBenefit: string;
    ctaExplore: string;
    growthEngine: string;
    weHelp: string;
  };
}

export default function HomeHero({ onNavigate, selectedLanguage, onAuthClick, t }: HomeHeroProps) {
  const isRtl = selectedLanguage === "Arabic";

  return (
    <section
      id="home"
      className="relative min-h-screen pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* Absolute background decoration elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 -right-32 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,54,105,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,54,105,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Huge Background Typography Accent */}
      <div className="absolute top-[280px] sm:top-[180px] right-[-10px] sm:right-[-40px] text-[75px] xs:text-[100px] sm:text-[150px] md:text-[280px] leading-none font-black text-brand-blue/[0.025] sm:text-brand-blue/[0.04] select-none pointer-events-none uppercase tracking-tighter font-display">
        {t.bgAgency}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Copy and CTA */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-8 text-start">
          {/* Main Display Heading - Brutalist Bold Typography */}
          <h1 
            className={`font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-[80px] xl:text-[95px] text-brand-blue uppercase ${
              isRtl 
                ? "leading-[1.15] tracking-normal" 
                : "leading-[0.85] tracking-tighter"
            }`}
            style={{ textShadow: "1px 1px 0px #f58a2d, 2px 2px 0px #f58a2d, 3px 3px 0px #f58a2d" }}
          >
            {t.headlineStart}<br />
            <span className="text-brand-orange" style={{ textShadow: "1px 1px 0px #113669, 2px 2px 0px #113669, 3px 3px 0px #113669" }}>{t.headlineMid}</span><br />
            {t.headlineMid2}<br />
            <span className="text-brand-orange" style={{ textShadow: "1px 1px 0px #113669, 2px 2px 0px #113669, 3px 3px 0px #113669" }}>{t.headlineEnd}</span>
          </h1>

          {/* Paragraph explanation */}
          <p className="text-base md:text-lg text-brand-blue/80 max-w-xl leading-relaxed font-medium">
            {t.paragraph}
          </p>

          {/* Dynamic Interactive Call to Action buttons - Rectangular & Stark */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => onAuthClick?.("signup")}
              className="group flex items-center justify-center space-x-3 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-xs uppercase tracking-widest font-bold px-8 py-4 rounded-none border border-brand-blue transition-all duration-300 cursor-pointer"
            >
              <span>{t.ctaBenefit}</span>
            </button>

            <button
              onClick={() => onNavigate("services")}
              className="group flex items-center justify-center space-x-2 bg-transparent hover:bg-brand-blue/5 border-2 border-brand-blue text-brand-blue font-mono text-xs uppercase tracking-widest font-bold px-8 py-4 rounded-none transition-all duration-300"
            >
              <span>{t.ctaExplore}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>


        </div>

        {/* Right Side: Futuristic visual agency card stack / mockup */}
        <div className="lg:col-span-5 relative mt-12 lg:mt-0 flex justify-center items-center">
          {/* Main Visual Composition Frame */}
          <div className="relative w-full max-w-md h-[450px] flex items-center justify-center">
            {/* Background floating visual grid representing social feed */}
            <div className="absolute top-4 left-6 w-72 bg-brand-white border-2 border-brand-blue rounded-none p-4 shadow-lg transform -rotate-3 hover:rotate-0 transition-all duration-500 z-10 hover:scale-105 text-start">
              <div className="flex items-center justify-between mb-3 border-b border-brand-blue/20 pb-2">
                <div className="flex items-center space-x-2">
                  <BrandLogo iconOnly size="xs" className="border border-brand-blue/20 bg-brand-orange/5 p-0.5" />
                  <span className="font-mono text-xs text-brand-blue font-bold">@jozelio_agency</span>
                </div>
                <Share2 className="w-3.5 h-3.5 text-brand-orange" />
              </div>
              <div className="w-full h-32 bg-brand-blue rounded-none flex items-center justify-center mb-3 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80"
                  alt="IT Support Specialist Sitting and Working"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-blue/70 flex flex-col justify-end p-3">
                  <span className="text-brand-orange text-[10px] font-mono tracking-widest uppercase font-bold">{t.growthEngine}</span>
                  <span className="text-brand-white font-display font-black text-sm uppercase leading-tight mt-1">{t.weHelp}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-brand-blue/20 rounded-none w-5/6"></div>
                <div className="h-2 bg-brand-blue/20 rounded-none w-2/3"></div>
                <div className="flex items-center space-x-2 pt-2">
                  <span className="text-[9px] font-mono font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-none">#GrowthMarketing</span>
                  <span className="text-[9px] font-mono font-bold text-brand-blue/60">#JozelioWeb</span>
                </div>
              </div>
            </div>

            {/* Foreground floating web mockup card */}
            <div className="absolute bottom-4 right-6 w-80 bg-brand-blue text-brand-white border-2 border-brand-blue rounded-none p-5 shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-500 z-20 hover:scale-105 text-start">
              <div className="flex items-center space-x-1.5 mb-4 border-b border-brand-white/10 pb-2">
                <span className="w-2.5 h-2.5 bg-brand-orange"></span>
                <span className="w-2.5 h-2.5 bg-brand-white/40"></span>
                <span className="w-2.5 h-2.5 bg-brand-white/20"></span>
                <span className="font-mono text-[9px] text-brand-white/60 ml-2">https://client.jozelio.com</span>
              </div>
              <div className="w-full h-36 bg-brand-white rounded-none flex items-center justify-center overflow-hidden relative border border-brand-white/10 mb-2">
                <img
                  src="https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=600&q=80"
                  alt="IT Professional Working on Code"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-blue/90 to-transparent p-3 pt-8">
                  <span className="text-brand-orange text-[9px] font-mono tracking-widest uppercase font-bold block">Developer Portal</span>
                  <span className="text-brand-white font-display font-black text-xs uppercase leading-tight mt-0.5 block">Custom Software Engineering</span>
                </div>
              </div>
            </div>

            {/* Decorative center ring overlay */}
            <div className="absolute w-64 h-64 border border-dashed border-brand-blue/20 rounded-full animate-spin-slow pointer-events-none"></div>
            <div className="absolute w-80 h-80 border border-dashed border-brand-orange/10 rounded-full animate-reverse-spin pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Bounce-Down indicator */}
      <button
        onClick={() => onNavigate("services")}
        className="absolute bottom-6 flex flex-col items-center space-y-1 text-brand-blue/60 hover:text-brand-orange transition-colors duration-300 focus:outline-none cursor-pointer"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Learn More</span>
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </button>
    </section>
  );
}
