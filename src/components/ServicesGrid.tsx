"use client";

import React, { useState } from "react";
import { ServiceDetail } from "../app/types";
import { Share2, Globe, Sparkles, Megaphone, ArrowRight, Check, X, Shield, Clock, Award, TrendingUp } from "lucide-react";

interface ServicesGridProps {
  t: {
    badge: string;
    title: string;
    desc: string;
    deliverableLabel: string;
    featuresLabel: string;
    closeBtn: string;
    exploreMore: string;
    servicesList: {
      "social-setup": {
        title: string;
        shortDesc: string;
        longDesc: string;
        features: string[];
        deliverable: string;
      };
      "social-management": {
        title: string;
        shortDesc: string;
        longDesc: string;
        features: string[];
        deliverable: string;
      };
      "web-dev": {
        title: string;
        shortDesc: string;
        longDesc: string;
        features: string[];
        deliverable: string;
      };
      "seo-optimization": {
        title: string;
        shortDesc: string;
        longDesc: string;
        features: string[];
        deliverable: string;
      };
    };
  };
}

export default function ServicesGrid({ t }: ServicesGridProps) {
  const [activeService, setActiveService] = useState<ServiceDetail | null>(null);

  const services: ServiceDetail[] = [
    {
      id: "social-setup",
      title: t.servicesList["social-setup"].title,
      icon: "Share2",
      shortDesc: t.servicesList["social-setup"].shortDesc,
      longDesc: t.servicesList["social-setup"].longDesc,
      features: t.servicesList["social-setup"].features,
      deliverable: t.servicesList["social-setup"].deliverable
    },
    {
      id: "social-management",
      title: t.servicesList["social-management"].title,
      icon: "Megaphone",
      shortDesc: t.servicesList["social-management"].shortDesc,
      longDesc: t.servicesList["social-management"].longDesc,
      features: t.servicesList["social-management"].features,
      deliverable: t.servicesList["social-management"].deliverable
    },
    {
      id: "web-dev",
      title: t.servicesList["web-dev"].title,
      icon: "Globe",
      shortDesc: t.servicesList["web-dev"].shortDesc,
      longDesc: t.servicesList["web-dev"].longDesc,
      features: t.servicesList["web-dev"].features,
      deliverable: t.servicesList["web-dev"].deliverable
    },
    {
      id: "seo-optimization",
      title: t.servicesList["seo-optimization"].title,
      icon: "TrendingUp",
      shortDesc: t.servicesList["seo-optimization"].shortDesc,
      longDesc: t.servicesList["seo-optimization"].longDesc,
      features: t.servicesList["seo-optimization"].features,
      deliverable: t.servicesList["seo-optimization"].deliverable
    }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Share2":
        return <Share2 className="w-8 h-8 text-brand-orange" />;
      case "Globe":
        return <Globe className="w-8 h-8 text-brand-orange" />;
      case "Sparkles":
        return <Sparkles className="w-8 h-8 text-brand-orange" />;
      case "Megaphone":
        return <Megaphone className="w-8 h-8 text-brand-orange" />;
      case "TrendingUp":
        return <TrendingUp className="w-8 h-8 text-brand-orange" />;
      default:
        return <Sparkles className="w-8 h-8 text-brand-orange" />;
    }
  };

  return (
    <section id="services" className="py-24 bg-brand-bg border-y-2 border-brand-blue relative">
      <div className="absolute top-10 right-10 w-72 h-72 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="text-start space-y-4 max-w-2xl">
            <h2 
              className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-brand-blue uppercase tracking-tighter leading-none"
              style={{ textShadow: "1px 1px 0px #f58a2d, 2px 2px 0px #f58a2d, 3px 3px 0px #f58a2d" }}
            >
              {t.title}
            </h2>
          </div>
          <p className="text-brand-blue/80 text-start md:text-end max-w-sm md:max-w-md leading-relaxed text-sm font-medium">
            {t.desc}
          </p>
        </div>

        {/* Services Grid - Bold Brutalist divides and sharp outlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="bg-brand-white border-2 border-brand-blue rounded-none p-8 text-start hover:bg-brand-blue hover:text-brand-white transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-none bg-brand-bg flex items-center justify-center border-2 border-brand-blue group-hover:bg-brand-white group-hover:border-brand-white transition-colors duration-300">
                    {getIcon(service.icon)}
                  </div>
                  <span className="font-mono text-xs text-brand-blue/50 font-bold uppercase group-hover:text-brand-white/50">
                    0{index + 1} {/* CAMPAIGN */}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight group-hover:text-brand-orange transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-brand-blue/80 text-sm leading-relaxed group-hover:text-brand-white/90 font-medium">
                    {service.shortDesc}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-8 border-t border-brand-blue/15 group-hover:border-brand-white/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-blue/50 font-bold uppercase tracking-widest group-hover:text-brand-white/60">
                  Custom Jozelio Stack
                </span>
                <button
                  onClick={() => setActiveService(service)}
                  className="flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wider text-brand-orange hover:!text-neutral-400 group-hover:text-brand-orange transition-colors duration-200 focus:outline-none cursor-pointer"
                >
                  <span>{t.exploreMore}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Drawer / Modal Overlay */}
      {activeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue/40 backdrop-blur-sm">
          <div
            className="bg-brand-bg border-2 border-brand-blue rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative text-brand-blue"
            id="service-modal"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveService(null)}
              className="absolute top-6 right-6 text-brand-blue hover:text-brand-orange p-2 rounded-none border border-brand-blue/20 bg-brand-blue/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 text-start">
              <div className="inline-flex items-center space-x-2 bg-brand-blue text-brand-white px-3 py-1 rounded-none text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-brand-orange" /> {t.badge}
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-none bg-brand-white flex items-center justify-center border-2 border-brand-blue">
                  {getIcon(activeService.icon)}
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
                  {activeService.title}
                </h3>
              </div>

              <p className="text-brand-blue/90 leading-relaxed text-sm font-medium">
                {activeService.longDesc}
              </p>

              {/* Scope of features */}
              <div className="space-y-3 pt-4 border-t border-brand-blue/20">
                <h4 className="font-display font-black text-base uppercase tracking-tight text-brand-blue">
                  {t.featuresLabel}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeService.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-brand-blue/80 font-medium">
                      <Check className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery info bar */}
              <div className="mt-6 p-4 rounded-none bg-brand-white border-2 border-brand-blue flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="flex items-center space-x-3 text-xs">
                  <Award className="w-5 h-5 text-brand-orange" />
                  <div>
                    <span className="block font-mono text-brand-blue/50 uppercase text-[9px] tracking-wider font-bold">
                      Standards Focus
                    </span>
                    <span className="text-brand-blue font-bold">Bespoke Excellence Guaranteed</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <Clock className="w-5 h-5 text-brand-orange" />
                  <div>
                    <span className="block font-mono text-brand-blue/50 uppercase text-[9px] tracking-wider font-bold">
                      Setup Speed
                    </span>
                    <span className="text-brand-blue font-bold">7-14 Days Delivery</span>
                  </div>
                </div>
              </div>

              {/* Deliverable info banner */}
              <div className="bg-brand-blue text-brand-white border border-brand-blue p-4 rounded-none text-xs text-center">
                <span className="font-mono text-brand-orange block mb-1 uppercase tracking-widest text-[9px] font-bold">
                  {t.deliverableLabel}
                </span>
                <p className="text-brand-white font-bold font-display text-sm">{activeService.deliverable}</p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setActiveService(null)}
                  className="px-5 py-2.5 rounded-none border border-brand-blue/30 text-brand-blue/70 hover:text-brand-blue hover:bg-brand-blue/5 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer"
                >
                  {t.closeBtn}
                </button>
                <button
                  onClick={() => {
                    setActiveService(null);
                    const element = document.getElementById("estimator");
                    if (element) {
                      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                      window.scrollTo({ top: elementPosition - 80, behavior: "smooth" });
                    }
                  }}
                  className="px-5 py-2.5 rounded-none bg-brand-orange hover:bg-brand-orange/90 text-brand-blue font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-brand-orange"
                >
                  Estimate Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
