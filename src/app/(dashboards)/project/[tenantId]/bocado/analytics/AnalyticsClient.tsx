"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BarChart3, Globe, Smartphone, Laptop, Sparkles, QrCode, Eye, Calendar, ChevronDown, X } from "lucide-react";

interface Tenant {
  id: string;
  businessName: string;
  subdomain: string;
}

interface AnalyticsClientProps {
  tenant: Tenant;
  totalViews: number;
  totalQrScans: number;
  uniqueVisitors: number;
  deviceBreakdown: { mobile: number; desktop: number };
  referrers: Array<{ name: string; count: number }>;
  timelineData: Array<{ date: string; views: number; scans: number }>;
  rangeKey: string;
  customStart: string;
  customEnd: string;
  lang?: string;
}

const PRESETS = [
  { key: "7d",  label: "Last 7 days",   labelAr: "آخر ٧ أيام" },
  { key: "28d", label: "Last 28 days",  labelAr: "آخر ٢٨ يومًا" },
  { key: "90d", label: "Last 90 days",  labelAr: "آخر ٩٠ يومًا" },
  { key: "1y",  label: "Last year",     labelAr: "آخر سنة" },
];

const translations = {
  English: {
    title: "Storefront Analytics",
    subtitle: "Real-time metrics for customer page views, QR code scans, and device traffic.",
    viewsCard: "Total Page Views",
    uniqueCard: "Unique Visitors",
    scansCard: "Total QR Code Scans",
    viewsSub: "Direct traffic to your menu storefront",
    uniqueSub: "Distinct individuals, once per day",
    scansSub: "Storefront traffic originating from QR scans",
    chartTitle: "Traffic Overview",
    legendViews: "Direct Views",
    legendScans: "QR Scans",
    breakdownTitle: "Device & Traffic Analytics",
    devicesHeader: "Device Breakdown",
    referralsHeader: "Top Traffic Referrers",
    noReferrers: "No external referral sources detected yet.",
    emptyChart: "No traffic recorded during this period.",
    mobileLabel: "Mobile Devices",
    desktopLabel: "Desktop Devices",
    dateRangeLabel: "Date Range",
    customRange: "Custom Range",
    applyRange: "Apply",
    cancelRange: "Cancel",
    from: "From",
    to: "To",
  },
  Arabic: {
    title: "تحليلات المتجر",
    subtitle: "إحصائيات مباشرة لمشاهدات صفحة المنيو، وعمليات مسح الـ QR، وأجهزة الزوار.",
    viewsCard: "إجمالي مشاهدات الصفحة",
    uniqueCard: "الزوار الفريدون",
    scansCard: "إجمالي مسح الـ QR",
    viewsSub: "زيارات مباشرة لمنيو متجرك الرقمي",
    uniqueSub: "أشخاص فريدون، مرة واحدة كل يوم",
    scansSub: "زيارات ناتجة عن مسح رمز الاستجابة السريعة",
    chartTitle: "مخطط الزيارات",
    legendViews: "مشاهدات مباشرة",
    legendScans: "مسح الـ QR",
    breakdownTitle: "تحليلات الأجهزة ومصادر الزيارة",
    devicesHeader: "تفصيل الأجهزة المستخدمة",
    referralsHeader: "أعلى مصادر زيارات المتجر",
    noReferrers: "لا توجد مصادر زيارة خارجية مسجلة حالياً.",
    emptyChart: "لا توجد زيارات مسجلة خلال هذه الفترة.",
    mobileLabel: "أجهزة الجوال",
    desktopLabel: "أجهزة الكمبيوتر",
    dateRangeLabel: "نطاق التاريخ",
    customRange: "نطاق مخصص",
    applyRange: "تطبيق",
    cancelRange: "إلغاء",
    from: "من",
    to: "إلى",
  },
};

export default function AnalyticsClient({
  tenant,
  totalViews,
  totalQrScans,
  uniqueVisitors,
  deviceBreakdown,
  referrers,
  timelineData,
  rangeKey,
  customStart,
  customEnd,
  lang = "English",
}: AnalyticsClientProps) {
  const t = translations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";
  const router = useRouter();
  const pathname = usePathname();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(rangeKey === "custom");
  const [customFrom, setCustomFrom] = useState(customStart || "");
  const [customTo, setCustomTo] = useState(customEnd || "");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setShowCustom(rangeKey === "custom");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [rangeKey]);

  const navigateRange = (key: string) => {
    router.push(`${pathname}?range=${key}`);
    setPickerOpen(false);
    setShowCustom(false);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    router.push(`${pathname}?start=${customFrom}&end=${customTo}`);
    setPickerOpen(false);
  };

  // Helper to format YYYY-MM-DD to DD/MM/YYYY
  const formatCustomDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Active label for the trigger button
  const activePreset = PRESETS.find((p) => p.key === rangeKey);
  const activeLabelText = rangeKey === "custom"
    ? `${formatCustomDate(customStart)} → ${formatCustomDate(customEnd)}`
    : (isRtl ? activePreset?.labelAr : activePreset?.label) || PRESETS[0].label;

  const totalEvents = totalViews + totalQrScans;
  const mobilePct = totalEvents > 0 ? Math.round((deviceBreakdown.mobile / totalEvents) * 100) : 0;
  const desktopPct = totalEvents > 0 ? Math.round((deviceBreakdown.desktop / totalEvents) * 100) : 0;

  const maxDayVal = Math.max(...timelineData.map((d) => d.views + d.scans), 1);

  // For large ranges, only show every Nth label to avoid crowding
  const labelStep = timelineData.length > 14 ? Math.ceil(timelineData.length / 14) : 1;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 text-start" dir={isRtl ? "rtl" : "ltr"}>

      {/* Header Banner */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
        <div>
          <h2 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-orange" />
            <span>{t.title}</span>
          </h2>
          <p className="text-brand-blue/70 text-xs mt-1 font-medium">{t.subtitle}</p>
        </div>

        {/* ── Date Range Picker ── */}
        <div className="relative z-20" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-2 bg-brand-white border-2 border-brand-blue px-3 py-2 font-mono text-[10px] font-black text-brand-blue uppercase tracking-wider shadow-[2px_2px_0px_#113669] hover:bg-brand-grey/20 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>{activeLabelText}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-brand-blue transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
          </button>

          {pickerOpen && (
            <div className="absolute top-full mt-2 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669] min-w-[220px] z-30"
              style={{ [isRtl ? "left" : "right"]: 0 }}>

              {/* Preset Options */}
              <div className="p-2 space-y-0.5">
                {PRESETS.map((preset) => {
                  const isActive = rangeKey === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => navigateRange(preset.key)}
                      className={`w-full text-start px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive
                          ? "bg-brand-blue text-brand-white"
                          : "text-brand-blue hover:bg-brand-grey/30"
                      }`}
                    >
                      {isRtl ? preset.labelAr : preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Range Section */}
              <div className="border-t-2 border-brand-blue/15 p-2">
                <button
                  type="button"
                  onClick={() => setShowCustom((v) => !v)}
                  className={`w-full text-start px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between ${
                    rangeKey === "custom"
                      ? "bg-brand-blue text-brand-white"
                      : "text-brand-blue hover:bg-brand-grey/30"
                  }`}
                >
                  <span>{t.customRange}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCustom ? "rotate-180" : ""}`} />
                </button>

                {showCustom && (
                  <div className="mt-2 px-1 space-y-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">{t.from}</label>
                      <input
                        type="date"
                        value={customFrom}
                        max={customTo || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="w-full h-8 px-2 border-2 border-brand-blue bg-brand-bg text-brand-blue font-mono text-[10px] font-bold focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">{t.to}</label>
                      <input
                        type="date"
                        value={customTo}
                        min={customFrom}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="w-full h-8 px-2 border-2 border-brand-blue bg-brand-bg text-brand-blue font-mono text-[10px] font-bold focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={!customFrom || !customTo}
                        onClick={applyCustom}
                        className="flex-1 py-2 bg-brand-blue text-brand-white font-mono text-[9px] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-brand-orange transition-colors"
                      >
                        {t.applyRange}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCustom(false); setPickerOpen(false); }}
                        className="px-3 py-2 border-2 border-brand-blue text-brand-blue font-mono text-[9px] font-black uppercase tracking-wider hover:bg-brand-grey/30 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Views */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="font-mono text-[9px] font-black text-brand-blue/60 uppercase tracking-widest block">{t.viewsCard}</span>
            <span className="font-display font-black text-3xl text-brand-blue block">{totalViews.toLocaleString()}</span>
            <p className="text-[10px] text-brand-blue/50 font-medium leading-tight">{t.viewsSub}</p>
          </div>
          <div className="w-12 h-12 border-2 border-brand-blue bg-brand-grey/30 flex items-center justify-center shrink-0 shadow-[2.5px_2.5px_0px_#113669]">
            <Eye className="w-5 h-5 text-brand-orange" />
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="font-mono text-[9px] font-black text-brand-blue/60 uppercase tracking-widest block">{t.uniqueCard}</span>
            <span className="font-display font-black text-3xl text-brand-blue block">{uniqueVisitors.toLocaleString()}</span>
            <p className="text-[10px] text-brand-blue/50 font-medium leading-tight">{t.uniqueSub}</p>
          </div>
          <div className="w-12 h-12 border-2 border-brand-blue bg-brand-grey/30 flex items-center justify-center shrink-0 shadow-[2.5px_2.5px_0px_#113669]">
            <Sparkles className="w-5 h-5 text-brand-orange" />
          </div>
        </div>

        {/* QR Scans */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#f58a2d] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="font-mono text-[9px] font-black text-brand-blue/60 uppercase tracking-widest block">{t.scansCard}</span>
            <span className="font-display font-black text-3xl text-brand-blue block">{totalQrScans.toLocaleString()}</span>
            <p className="text-[10px] text-brand-blue/50 font-medium leading-tight">{t.scansSub}</p>
          </div>
          <div className="w-12 h-12 border-2 border-brand-blue bg-brand-grey/30 flex items-center justify-center shrink-0 shadow-[2.5px_2.5px_0px_#113669]">
            <QrCode className="w-5 h-5 text-brand-orange" />
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-blue/15 pb-4">
          <h3 className="font-display font-black text-xs text-brand-blue uppercase tracking-wider">{t.chartTitle}</h3>
          <div className="flex items-center gap-4 font-mono text-[9px] font-black uppercase tracking-wide">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-brand-blue bg-brand-blue" />
              <span>{t.legendViews}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-brand-blue bg-brand-orange" />
              <span>{t.legendScans}</span>
            </div>
          </div>
        </div>

        {totalEvents === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-brand-bg/25 border-2 border-dashed border-brand-blue/20">
            <BarChart3 className="w-8 h-8 text-brand-blue/30 mb-2" />
            <p className="font-mono text-[10px] font-bold text-brand-blue/45 uppercase">{t.emptyChart}</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div 
              className="h-72 flex items-end gap-1.5 pt-6 px-2 border-b border-l border-brand-blue/30 relative mb-6"
              style={{ minWidth: `${Math.max(500, timelineData.length * 16)}px` }}
            >
              {timelineData.map((d, index) => {
                const dayTotal = d.views + d.scans;
                const combinedPct = (dayTotal / maxDayVal) * 100;
                const showLabel = index % labelStep === 0 || index === timelineData.length - 1;

                const dateObj = new Date(d.date + "T00:00:00");
                const label = dateObj.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                  month: "short",
                  day: "numeric",
                });

                const isNarrow = timelineData.length > 30;

                return (
                  <div key={index} className="flex-1 min-w-[2px] max-w-[60px] flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-brand-blue text-brand-white border border-brand-blue px-2.5 py-1 text-[8px] font-mono font-bold uppercase pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-[2px_2px_0px_#f58a2d] text-center min-w-[70px] left-1/2 -translate-x-1/2">
                      <div className="text-[7px] text-brand-white/70">{label}</div>
                      <div className="text-brand-orange mt-0.5">{dayTotal} total</div>
                      <div className="text-[7px] text-brand-white/80 mt-0.5">{d.views}v | {d.scans}s</div>
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full flex flex-col justify-end border-brand-blue group-hover:scale-[1.04] transition-transform duration-200 ${
                        isNarrow ? "border" : "border-2"
                      }`}
                      style={{ height: `${combinedPct}%`, minHeight: dayTotal > 0 ? "6px" : "0px" }}
                    >
                      <div className="bg-brand-blue w-full" style={{ height: `${dayTotal > 0 ? (d.views / dayTotal) * 100 : 0}%` }} />
                      <div className="bg-brand-orange w-full" style={{ height: `${dayTotal > 0 ? (d.scans / dayTotal) * 100 : 0}%` }} />
                    </div>

                    {/* Date label */}
                    {showLabel && (
                      <span className="font-mono text-[7px] font-black text-brand-blue/60 uppercase tracking-tight absolute top-full mt-2 text-center whitespace-nowrap left-1/2 -translate-x-1/2">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] space-y-4">
          <h3 className="font-display font-black text-xs text-brand-blue uppercase tracking-wider border-b border-brand-blue/15 pb-3 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-brand-orange" />
            <span>{t.devicesHeader}</span>
          </h3>
          {totalEvents === 0 ? (
            <p className="text-[10px] text-brand-blue/45 font-mono font-bold uppercase">{t.noReferrers}</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /><span>{t.mobileLabel}</span></span>
                  <span className="font-mono font-black text-brand-orange">{mobilePct}% ({deviceBreakdown.mobile})</span>
                </div>
                <div className="w-full bg-brand-grey border border-brand-blue h-3.5 p-0.5">
                  <div className="bg-brand-orange border border-brand-blue h-full transition-all duration-500" style={{ width: `${mobilePct}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><Laptop className="w-3.5 h-3.5" /><span>{t.desktopLabel}</span></span>
                  <span className="font-mono font-black text-brand-blue">{desktopPct}% ({deviceBreakdown.desktop})</span>
                </div>
                <div className="w-full bg-brand-grey border border-brand-blue h-3.5 p-0.5">
                  <div className="bg-brand-blue border border-brand-blue h-full transition-all duration-500" style={{ width: `${desktopPct}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] space-y-4">
          <h3 className="font-display font-black text-xs text-brand-blue uppercase tracking-wider border-b border-brand-blue/15 pb-3 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-brand-orange" />
            <span>{t.referralsHeader}</span>
          </h3>
          {referrers.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[10px] text-brand-blue/45 font-mono font-bold uppercase">{t.noReferrers}</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {referrers.map((ref, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-brand-blue/5 pb-2.5 last:border-0 last:pb-0 font-medium text-xs">
                  <span className="font-mono text-[10px] text-brand-blue/80 truncate max-w-[200px]" title={ref.name}>{ref.name}</span>
                  <span className="font-mono font-black text-brand-orange bg-brand-blue/5 border border-brand-blue/10 px-2 py-0.5">{ref.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
