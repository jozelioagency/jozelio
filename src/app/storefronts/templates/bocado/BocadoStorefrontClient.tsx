"use client";

import { useState, useEffect } from "react";
import { Globe, X, Search, Filter, ShoppingBag, Plus, Minus, Trash2, ClipboardList } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface MenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: number;
  currency: string;
  category: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

const translations = {
  en: {
    menu: "Menu",
    currency: "EGP",
    noItems: "No menu items available at this time.",
    bannerTitle: "Menu Powered by Jozelio",
    closed: "Sold Out",
    searchPlaceholder: "SEARCH...",
    allCategories: "All",
    filter: "Filter",
    ourLocations: "Our Locations",
    mainBranch: "Main Branch",
    viewMap: "View Map",
    addToOrder: "Add to Order",
    myOrder: "My Order",
    showToWaiter: "Show Order",
    orderSummaryTitle: "Order for Waiter / Cashier",
    orderForWaiterSubtitle: "Show this screen to the waiter or cashier to place your order.",
    emptyOrder: "Your order is empty. Add items from the menu above!",
    total: "Total Amount",
    clearOrder: "Clear Order",
    orderNotes: "Special Requests / Notes",
    notesPlaceholder: "Enter your notes here so you don't forget them while ordering",
    itemsCount: "items",
    itemCount: "item",
    close: "Close",
  },
  ar: {
    menu: "المنيو",
    currency: "جنيه",
    noItems: "لا توجد أطباق متوفرة في القائمة حالياً.",
    bannerTitle: "قائمة طعام رقمية مدعومة من جوزيليو",
    closed: "غير متوفر",
    searchPlaceholder: "ابحث في المنيو...",
    allCategories: "الكل",
    filter: "تصفية",
    ourLocations: "فروعنا",
    mainBranch: "الفرع الرئيسي",
    viewMap: "عرض الخريطة",
    addToOrder: "أضف للطلب",
    myOrder: "طلبي",
    showToWaiter: "عرض الطلب",
    orderSummaryTitle: "ملخص الطلب (للموظف / الكاشير)",
    orderForWaiterSubtitle: "قم بإظهار هذه الشاشة للنادل أو الكاشير لتأكيد وطلب أطباقك.",
    emptyOrder: "قائمة طلبك فارغة. أضف أطباقاً من المنيو أعلاه!",
    total: "إجمالي الطلب",
    clearOrder: "مسح الطلب",
    orderNotes: "ملاحظات خاصة / تعليمات للطلب",
    notesPlaceholder: "اكتب ملاحظاتك هنا حتى لا تنساها أثناء الطلب",
    itemsCount: "أصناف",
    itemCount: "صنف",
    close: "إغلاق",
  },
};

const formatWhatsAppUrl = (val: string) => {
  if (!val) return "";
  const cleaned = val.trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  const numOnly = cleaned.replace(/[^\d]/g, "");
  return `https://wa.me/${numOnly}`;
};

const formatTelegramUrl = (val: string) => {
  if (!val) return "";
  const cleaned = val.trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  const username = cleaned.replace(/^@/, "");
  return `https://t.me/${username}`;
};

export default function BocadoStorefrontClient({
  subdomain,
  businessName,
  menuItems,
  themePrimaryColor = "#f58a2d",
  themeSecondaryColor = "#113669",
  themeNeutralColor = "#eaeaea",
  instagramUrl = null,
  facebookUrl = null,
  tiktokUrl = null,
  twitterUrl = null,
  whatsapp = null,
  telegram = null,
  languages = [],
  hideBranding = false,
  showLocations = true,
  location = null,
  googleMapsLink = null,
  hasBranches = false,
  branchesJson = null,
  advancedColors = {},
}: {
  subdomain: string;
  businessName: string;
  menuItems: MenuItem[];
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  themeNeutralColor?: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  twitterUrl?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  languages?: Array<{ name: string; dir: "rtl" | "ltr" }>;
  hideBranding?: boolean;
  showLocations?: boolean;
  location?: string | null;
  googleMapsLink?: string | null;
  hasBranches?: boolean;
  branchesJson?: string | null;
  advancedColors?: any;
}) {
  const allLangs = ["English", ...languages.map(l => l.name)];
  const [activeLang, setActiveLang] = useState<string>("English");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showLangSelectorModal, setShowLangSelectorModal] = useState(false);
  const [searchSelectorLangQuery, setSearchSelectorLangQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isFloatingBarDismissed, setIsFloatingBarDismissed] = useState(false);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(`bocado_order_${subdomain}`);
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        if (parsed && typeof parsed === "object") {
          setOrderItems(parsed.items || {});
          setOrderNotes(parsed.notes || "");
        }
      }
    } catch {}
  }, [subdomain]);

  const saveOrderToStorage = (newItems: Record<string, number>, newNotes: string) => {
    try {
      localStorage.setItem(`bocado_order_${subdomain}`, JSON.stringify({ items: newItems, notes: newNotes }));
    } catch {}
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setOrderItems((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = currentQty + delta;
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = newQty;
        setIsFloatingBarDismissed(false);
      }
      saveOrderToStorage(updated, orderNotes);
      return updated;
    });
  };

  const handleNotesChange = (notes: string) => {
    setOrderNotes(notes);
    saveOrderToStorage(orderItems, notes);
  };

  const clearOrder = () => {
    setOrderItems({});
    setOrderNotes("");
    setIsFloatingBarDismissed(false);
    try {
      localStorage.removeItem(`bocado_order_${subdomain}`);
    } catch {}
  };

  const totalItemCount = Object.entries(orderItems).reduce((sum, [id, qty]) => {
    const item = menuItems.find(i => i.id === id);
    return item && item.isAvailable ? sum + qty : sum;
  }, 0);

  const totalPrice = Object.entries(orderItems).reduce((sum, [id, qty]) => {
    const item = menuItems.find(i => i.id === id);
    return item && item.isAvailable ? sum + (item.price / 100) * qty : sum;
  }, 0);

  const activeLangConfig = activeLang === "English"
    ? { name: "English", dir: "ltr" as const }
    : (languages.find(l => l.name === activeLang) || { name: activeLang, dir: "ltr" as const });

  const isRtl = activeLangConfig.dir === "rtl";
  const t = translations[isRtl ? "ar" : "en"];

  useEffect(() => {
    document.documentElement.dir = activeLangConfig.dir;
    document.documentElement.lang = activeLangConfig.dir === "rtl" ? "ar" : "en";
  }, [activeLangConfig]);

  function getTranslatedValue(item: MenuItem, field: "name" | "desc"): string {
    const englishVal = (field === "name" ? item.nameEn : item.descriptionEn) || "";
    if (activeLang === "English") {
      return englishVal;
    }
    
    const rawVal = field === "name" ? item.nameAr : item.descriptionAr;
    if (!rawVal) return englishVal;
    
    const trimmed = rawVal.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as Array<{ lang: string; val: string; dir: "rtl" | "ltr" }>;
        const match = parsed.find(p => p.lang === activeLang);
        if (match && match.val.trim() !== "") return match.val;
      } catch {
        // ignore
      }
    }
    
    // Legacy fallback: if activeLang is "Arabic" and nameAr is not JSON, return nameAr
    if (activeLang === "Arabic" && !trimmed.startsWith("[")) {
      return trimmed || englishVal;
    }
    
    return englishVal;
  }

  const categories = ["All", ...Array.from(new Set(menuItems.map(item => item.category || "General")))];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || (item.category || "General") === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      getTranslatedValue(item, "name").toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTranslatedValue(item, "desc").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  let parsedBranches: Array<{ location: string; googleMapsLink: string }> = [];
  if (hasBranches && branchesJson) {
    try {
      parsedBranches = JSON.parse(branchesJson);
    } catch {}
  }
  const showLocationsSection = showLocations && (location || parsedBranches.length > 0);

  return (
    <div
      className={`min-h-screen bg-brand-bg text-brand-blue flex flex-col font-sans relative`}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --color-brand-orange: ${themePrimaryColor} !important;
          --color-brand-blue: ${themeSecondaryColor} !important;
          --color-brand-grey: ${themeNeutralColor} !important;
          --color-brand-bg: ${themeNeutralColor} !important;
          --color-brand-dark: ${themeSecondaryColor} !important;

          --adv-navbar-bg: ${advancedColors.navbarBgColor || 'transparent'};
          --adv-navbar-text: ${advancedColors.navbarTextColor || themeSecondaryColor};
          --adv-footer-bg: ${advancedColors.footerBgColor || 'transparent'};
          --adv-footer-text: ${advancedColors.footerTextColor || themeSecondaryColor};
          --adv-card-bg: ${advancedColors.cardBgColor || '#ffffff'};
          --adv-card-text: ${advancedColors.cardTextColor || themeSecondaryColor};
          --adv-btn-bg: ${advancedColors.buttonBgColor || themePrimaryColor};
          --adv-btn-text: ${advancedColors.buttonTextColor || '#ffffff'};
        }
        body {
          background-color: ${themeNeutralColor} !important;
          color: ${themeSecondaryColor} !important;
        }
        ::-webkit-scrollbar-thumb {
          background: ${themeSecondaryColor} !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${themePrimaryColor} !important;
        }
        ::-webkit-scrollbar-track {
          background: ${themeNeutralColor} !important;
        }
      `}} />
      {/* Decorative Brand Light Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-brand-blue/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-brand-orange/[0.02] blur-[150px]" />
      </div>

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,54,105,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,54,105,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

      {/* ─── PWA Header ─────────────────────────────────── */}
      <header 
        className="relative z-10 border-b border-brand-blue/20 bg-brand-white/40 backdrop-blur-md"
        style={{ '--color-brand-blue': advancedColors.navbarTextColor || themeSecondaryColor, backgroundColor: 'var(--adv-navbar-bg)' } as React.CSSProperties}
      >
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            {hideBranding ? (
              <h1 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight" style={{ textShadow: "0.5px 0.5px 0px #f58a2d" }}>
                {businessName}
              </h1>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] font-bold text-brand-blue/50 tracking-widest uppercase">
                  Powered by
                </span>
                <BrandLogo layout="horizontal" size="sm" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Header Order Button */}
            <button
              onClick={() => setShowOrderModal(true)}
              className="h-[38px] px-3 bg-brand-white border-2 border-brand-blue text-brand-blue font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all cursor-pointer relative"
              title={t.myOrder}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">{t.myOrder}</span>
              {totalItemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-orange text-brand-white text-[10px] font-black flex items-center justify-center border border-brand-blue shadow-[1px_1px_0px_#113669]">
                  {totalItemCount}
                </span>
              )}
            </button>

            {allLangs.length > 1 && (
              <>
                {/* Mobile Language Selector Button */}
                <button
                  onClick={() => setShowLangSelectorModal(true)}
                  className="sm:hidden h-[38px] px-3 bg-brand-white border-2 border-brand-blue text-brand-blue font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>{activeLangConfig.name.substring(0, 2)}</span>
                </button>

                {/* Desktop Language Selector */}
                <div className="hidden sm:block">
                  {allLangs.length <= 3 ? (
                    <div className="flex items-center gap-1 bg-brand-grey/25 p-1 border border-brand-blue/15 shadow-[1px_1px_0px_rgba(17,54,105,0.05)]">
                      {allLangs.map((langName) => {
                        const isSelected = activeLang === langName;
                        return (
                          <button
                            key={langName}
                            onClick={() => setActiveLang(langName)}
                            className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                              isSelected 
                                ? "bg-brand-blue text-brand-white border border-brand-blue shadow-[1px_1px_0px_#113669]" 
                                : "text-brand-blue/70 hover:text-brand-blue hover:bg-brand-grey/50"
                            }`}
                          >
                            {langName}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-brand-grey/25 p-1 border border-brand-blue/15 shadow-[1px_1px_0px_rgba(17,54,105,0.05)]">
                      {(() => {
                        const displayedLangs = ["English"];
                        const secondaryLangs = allLangs.filter(l => l !== "English");
                        if (activeLang === "English" || secondaryLangs.slice(0, 1).includes(activeLang)) {
                          if (secondaryLangs.length > 0) {
                            displayedLangs.push(secondaryLangs[0]);
                          }
                        } else {
                          displayedLangs.push(activeLang);
                        }

                        return displayedLangs.map((langName) => {
                          const isSelected = activeLang === langName;
                          return (
                            <button
                              key={langName}
                              onClick={() => setActiveLang(langName)}
                              className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                                isSelected 
                                  ? "bg-brand-blue text-brand-white border border-brand-blue shadow-[1px_1px_0px_#113669]" 
                                  : "text-brand-blue/70 hover:text-brand-blue hover:bg-brand-grey/50"
                              }`}
                            >
                              {langName}
                            </button>
                          );
                        });
                      })()}
                      <button
                        onClick={() => setShowLangSelectorModal(true)}
                        className="px-2 py-1.5 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#113669] hover:bg-brand-blue hover:text-brand-white transition-all cursor-pointer hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        style={{ backgroundColor: 'var(--adv-btn-bg)', color: 'var(--adv-btn-text)' }}
                      >
                        {isRtl ? "المزيد +" : "+ More"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
 
      {/* ─── Store Portal Layout ─────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {/* Menu Listings Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h2 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight" style={{ textShadow: "1px 1px 0px #f58a2d" }}>
              {t.menu}
            </h2>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <span className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-brand-blue/50`}>
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-brand-white border-2 border-brand-blue text-brand-blue text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange shadow-[2px_2px_0px_#113669] transition-all`}
                />
              </div>

              {categories.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="h-[38px] px-3 bg-brand-white border-2 border-brand-blue text-brand-blue font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all cursor-pointer"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.filter}</span>
                  </button>

                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)} />
                      <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-full mt-2 w-48 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669] z-50 flex flex-col max-h-64 overflow-y-auto`}>
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-start px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 border-brand-blue/10 last:border-0 hover:bg-brand-blue hover:text-brand-white transition-colors cursor-pointer ${
                              selectedCategory === category ? "bg-brand-blue/10 text-brand-orange" : "text-brand-blue"
                            }`}
                          >
                            {category === "All" ? t.allCategories : category}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
 
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
              <svg className="w-12 h-12 text-brand-blue/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <p className="text-brand-blue/80 text-xs font-semibold">{t.noItems}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669] flex flex-col justify-between gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#113669] transition-all duration-200"
                  style={{ '--color-brand-blue': advancedColors.cardTextColor || themeSecondaryColor, backgroundColor: 'var(--adv-card-bg)' } as React.CSSProperties}
                >
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <div className="relative w-20 h-20 border-2 border-brand-blue overflow-hidden shrink-0 shadow-[2px_2px_0px_#113669]">
                        <img
                          src={item.imageUrl}
                          alt={getTranslatedValue(item, "name")}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-widest">
                        {item.category || "General"}
                      </span>
                      <h3 className="font-display font-black text-brand-blue text-base mt-0.5 truncate uppercase">
                        {getTranslatedValue(item, "name")}
                      </h3>
                      <p className="text-brand-blue/70 text-xs mt-1 line-clamp-2 leading-relaxed font-medium">
                        {getTranslatedValue(item, "desc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-brand-blue/20 pt-3 mt-1">
                    <span className="font-mono text-[#f58a2d] font-bold text-sm">
                      {(item.price / 100).toFixed(2)} {t.currency}
                    </span>

                    <div className="flex items-center gap-2">
                      {!item.isAvailable ? (
                        <span className="font-mono text-[9px] text-rose-500 uppercase font-black bg-rose-50 border border-rose-500/20 px-2 py-0.5 shadow-[1px_1px_0px_rgba(239,68,68,0.2)]">
                          {t.closed}
                        </span>
                      ) : (
                        <>
                          {item.imageUrl && (
                            <button
                              onClick={() => setFullscreenImage(item.imageUrl)}
                              className="w-8 h-8 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all cursor-pointer"
                              aria-label="View image fullscreen"
                              title="View Image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                            </button>
                          )}

                          {(orderItems[item.id] || 0) === 0 ? (
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-8 px-2.5 bg-brand-orange hover:bg-brand-blue text-brand-white font-mono text-[10px] font-black uppercase tracking-wider border-2 border-brand-blue flex items-center gap-1 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all cursor-pointer"
                              style={{ backgroundColor: 'var(--adv-btn-bg)', color: 'var(--adv-btn-text)' }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.addToOrder}</span>
                            </button>
                          ) : (
                            <div className="flex items-center border-2 border-brand-blue bg-brand-white shadow-[2px_2px_0px_#113669]">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-colors cursor-pointer border-r border-brand-blue/30"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs font-black text-brand-blue select-none">
                                {orderItems[item.id]}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-colors cursor-pointer border-l border-brand-blue/30"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── Locations Section removed to be a modal ─── */}

      {/* ─── PWA Footer ─────────────────────────────────── */}
      <footer 
        className="mt-12 border-t-2 border-brand-blue bg-brand-white py-8 px-6 relative z-10"
        style={{ '--color-brand-blue': advancedColors.footerTextColor || themeSecondaryColor, backgroundColor: 'var(--adv-footer-bg)' } as React.CSSProperties}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-start">
            <h4 className="font-display font-black text-lg text-brand-blue uppercase tracking-tight">
              {businessName}
            </h4>
            {!hideBranding && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 mt-2">
                <span className="text-[10px] text-brand-blue/55 font-mono uppercase tracking-widest mt-[2px]">
                  Powered by
                </span>
                <BrandLogo layout="horizontal" size="xs" />
              </div>
            )}
          </div>

          {/* Links List */}
          {(instagramUrl || facebookUrl || tiktokUrl || twitterUrl || whatsapp || telegram || showLocationsSection) && (
            <div className="flex flex-wrap items-center gap-4">
              {showLocationsSection && (
                <button
                  onClick={() => setShowLocationsModal(true)}
                  className="h-9 px-3 border-2 border-brand-blue bg-brand-orange flex items-center justify-center gap-2 text-brand-white hover:bg-brand-blue transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 font-mono text-[10px] uppercase font-black tracking-widest"
                  title={t.ourLocations}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline">{t.ourLocations}</span>
                </button>
              )}
              {whatsapp && (
                <a
                  href={formatWhatsAppUrl(whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
                  title="WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"></path>
                  </svg>
                </a>
              )}

              {telegram && (
                <a
                  href={formatTelegramUrl(telegram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
                  title="Telegram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"></path>
                  </svg>
                </a>
              )}

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}

              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              )}

              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
                  title="TikTok"
                >
                  <svg className="w-4 h-4 fill-current text-brand-blue hover:text-brand-white" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.14 2.29 1.88 3.73 2.13v3.9c-1.39-.15-2.74-.77-3.78-1.74a7.99 7.99 0 01-1.34-1.8c-.06 2.37-.03 4.74-.04 7.11a8.4 8.4 0 01-2.14 5.56 8.302 8.302 0 01-6.11 2.62A8.28 8.28 0 01.03 13.72a8.312 8.312 0 012.63-6.13c1.55-1.44 3.65-2.22 5.75-2.15 1.15.02 2.3.26 3.36.72v4.06c-.84-.44-1.78-.66-2.73-.62a4.34 4.34 0 00-3.03 1.34 4.256 4.256 0 00-1.12 3.1 4.28 4.28 0 001.35 3.02 4.31 4.31 0 003.04 1.25 4.34 4.34 0 004.14-3.4c.08-.43.08-.87.08-1.3V.02h.01z"></path>
                  </svg>
                </a>
              )}

              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border-2 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0"
                  title="Twitter (X)"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* ─── Locations Modal ─── */}
      {showLocationsModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-blue/90 backdrop-blur-sm p-4"
          onClick={() => setShowLocationsModal(false)}
        >
          <div 
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#f58a2d] relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--adv-card-bg)', color: 'var(--adv-card-text)' }}
          >
            <div className="sticky top-0 bg-brand-white border-b-2 border-brand-blue p-4 md:p-6 flex items-center justify-between z-10" style={{ backgroundColor: 'var(--adv-card-bg)' }}>
              <h3 className="font-display font-black text-lg md:text-xl text-brand-blue uppercase tracking-tight flex items-center gap-3">
                <span className="text-brand-orange">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                {t.ourLocations}
              </h3>
              <button 
                onClick={() => setShowLocationsModal(false)}
                className="w-8 h-8 border-2 border-brand-blue flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 bg-brand-white"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 md:p-6 flex flex-col gap-4">
              {location && (
                <div className="border-2 border-brand-blue bg-brand-bg p-4 shadow-[2px_2px_0px_#113669] flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest font-black text-brand-orange bg-brand-orange/10 px-2 py-0.5 border border-brand-orange/20 mb-2 inline-block">
                        {t.mainBranch}
                      </span>
                      <p className="font-semibold text-sm leading-relaxed text-brand-blue">{location}</p>
                    </div>
                  </div>
                  {googleMapsLink && (
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest font-black text-brand-white bg-brand-blue hover:bg-brand-orange border-2 border-brand-blue px-3 py-2 w-full shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all mt-1"
                    >
                      <span>{t.viewMap}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}
                </div>
              )}
              
              {parsedBranches.map((branch, idx) => {
                if (!branch.location) return null;
                return (
                  <div key={idx} className="border-2 border-brand-blue bg-brand-bg p-4 shadow-[2px_2px_0px_#113669] flex flex-col gap-3">
                    <p className="font-semibold text-sm leading-relaxed text-brand-blue mt-1">{branch.location}</p>
                    {branch.googleMapsLink && (
                      <a
                        href={branch.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest font-black text-brand-blue bg-brand-white hover:text-brand-orange border-2 border-brand-blue px-3 py-2 w-full shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 transition-all mt-1"
                      >
                        <span>{t.viewMap}</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/90 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={fullscreenImage} 
              alt="Fullscreen" 
              className="max-w-full max-h-full object-contain border-4 border-brand-white shadow-[8px_8px_0px_#f58a2d]"
            />
            <button 
              className="absolute top-0 right-0 md:top-4 md:right-4 w-10 h-10 bg-brand-white border-2 border-brand-blue flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 transition-all cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
              aria-label="Close fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* ─── Floating Bottom Bar for Waiter Order ─── */}
      {totalItemCount > 0 && !isFloatingBarDismissed && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-brand-blue text-brand-white border-4 border-brand-blue p-3 shadow-[6px_6px_0px_#f58a2d] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex flex-col text-start">
            <span className="font-mono text-[9px] font-bold uppercase text-brand-white/70 tracking-widest">
              {t.total}
            </span>
            <span className="font-mono font-black text-sm text-brand-orange">
              {totalPrice.toFixed(2)} {t.currency}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrderModal(true)}
              className="h-10 px-4 bg-brand-orange hover:bg-brand-white hover:text-brand-blue text-brand-white border-2 border-brand-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t.showToWaiter}</span>
            </button>

            <button
              onClick={() => setIsFloatingBarDismissed(true)}
              className="w-10 h-10 border-2 border-brand-white bg-brand-blue/80 hover:bg-rose-500 text-brand-white flex items-center justify-center shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              aria-label="Hide order bar"
              title="Hide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Order Summary Modal (Show to Waiter / Cashier) ─── */}
      {showOrderModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-blue/90 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowOrderModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#f58a2d] relative flex flex-col text-brand-blue text-start"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--adv-card-bg)', color: 'var(--adv-card-text)' }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-brand-white border-b-2 border-brand-blue p-4 md:p-5 flex items-center justify-between z-10" style={{ backgroundColor: 'var(--adv-card-bg)' }}>
              <div>
                <h3 className="font-display font-black text-base md:text-lg text-brand-blue uppercase tracking-tight">
                  {t.orderSummaryTitle}
                </h3>
                <p className="text-[10px] text-brand-blue/60 font-semibold mt-0.5">
                  {t.orderForWaiterSubtitle}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 overflow-y-auto flex flex-col gap-5 flex-1 min-h-0">
              {totalItemCount === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-brand-blue/30 bg-brand-bg/30 flex flex-col items-center justify-center gap-3">
                  <ShoppingBag className="w-10 h-10 text-brand-blue/30" />
                  <p className="text-xs font-semibold text-brand-blue/70 leading-relaxed">
                    {t.emptyOrder}
                  </p>
                </div>
              ) : (
                <>
                  {/* List of Ordered Items */}
                  <div className="space-y-3">
                    {Object.entries(orderItems).map(([itemId, qty]) => {
                      const item = menuItems.find((i) => i.id === itemId);
                      if (!item || !item.isAvailable || qty <= 0) return null;
                      const itemTotal = (item.price / 100) * qty;

                      return (
                        <div
                          key={itemId}
                          className="p-3.5 bg-brand-white border-2 border-brand-blue shadow-[3px_3px_0px_#113669] flex items-center justify-between gap-3"
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-display font-black text-sm text-brand-blue uppercase truncate">
                              {getTranslatedValue(item, "name")}
                            </span>
                            <span className="font-mono text-[10px] text-brand-orange font-bold mt-0.5">
                              {(item.price / 100).toFixed(2)} {t.currency} &times; {qty} = {itemTotal.toFixed(2)} {t.currency}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quantity Modifier */}
                            <div className="flex items-center border-2 border-brand-blue bg-brand-white shadow-[1.5px_1.5px_0px_#113669]">
                              <button
                                onClick={() => updateQuantity(itemId, -1)}
                                className="w-7 h-7 flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-colors cursor-pointer border-r border-brand-blue/30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs font-black text-brand-blue select-none">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQuantity(itemId, 1)}
                                className="w-7 h-7 flex items-center justify-center text-brand-blue hover:bg-brand-orange hover:text-brand-white transition-colors cursor-pointer border-l border-brand-blue/30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Trash / Delete button */}
                            <button
                              onClick={() => updateQuantity(itemId, -qty)}
                              className="w-7 h-7 border-2 border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-[1.5px_1.5px_0px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Instructions / Notes */}
                  <div className="space-y-1.5 pt-2 border-t-2 border-brand-blue/15">
                    <label className="block font-mono text-[9px] font-black uppercase tracking-wider text-brand-blue/70">
                      {t.orderNotes}
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder={t.notesPlaceholder}
                      rows={2}
                      className="w-full p-2.5 bg-brand-white border-2 border-brand-blue text-brand-blue text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange shadow-[2px_2px_0px_#113669] resize-none"
                    />
                  </div>

                  {/* Total Banner for Waiter */}
                  <div className="p-4 bg-brand-blue text-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#f58a2d] flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[9px] font-bold uppercase text-brand-white/70 tracking-widest block">
                        {t.total}
                      </span>
                      <span className="font-mono text-[10px] text-brand-white/50">
                        {totalItemCount} {totalItemCount === 1 ? t.itemCount : t.itemsCount}
                      </span>
                    </div>
                    <span className="font-mono font-black text-2xl text-brand-orange tracking-tight">
                      {totalPrice.toFixed(2)} {t.currency}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-brand-blue bg-brand-white flex items-center justify-between gap-3 z-10" style={{ backgroundColor: 'var(--adv-card-bg)' }}>
              {totalItemCount > 0 ? (
                <button
                  onClick={clearOrder}
                  className="h-10 px-4 border-2 border-rose-500 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.clearOrder}</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setShowOrderModal(false)}
                className="h-10 px-6 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-xs font-black uppercase tracking-wider hover:bg-brand-blue transition-all shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                style={{ backgroundColor: 'var(--adv-btn-bg)', color: 'var(--adv-btn-text)' }}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Language Selector Modal Overlay ─── */}
      {showLangSelectorModal && (() => {
        const queryLower = searchSelectorLangQuery.toLowerCase().trim();
        const filteredLangs = allLangs.filter(langName => 
          langName.toLowerCase().includes(queryLower)
        );
        const handleClose = () => {
          setShowLangSelectorModal(false);
          setSearchSelectorLangQuery("");
        };

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-100">
            <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-md w-full shadow-[8px_8px_0px_#113669] flex flex-col gap-4 text-brand-blue text-start">
              <div className="flex items-center justify-between border-b-2 border-brand-blue pb-3">
                <h3 className="font-display font-black text-sm uppercase tracking-wider">
                  {isRtl ? "اختر لغة العرض" : "Select Language"}
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white font-mono text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={searchSelectorLangQuery}
                  onChange={(e) => setSearchSelectorLangQuery(e.target.value)}
                  placeholder={isRtl ? "ابحث عن لغة..." : "Search for a language..."}
                  className="w-full h-9 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue text-xs font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 border-2 border-brand-blue/15 bg-brand-bg/5 p-2">
                {filteredLangs.map((langName) => {
                  const isSelected = activeLang === langName;
                  const langConfig = langName === "English"
                    ? { dir: "ltr" }
                    : (languages.find(l => l.name === langName) || { dir: "ltr" });

                  return (
                    <button
                      key={langName}
                      type="button"
                      onClick={() => {
                        setActiveLang(langName);
                        handleClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 border text-xs cursor-pointer select-none transition-all ${
                        isSelected
                          ? "bg-brand-blue text-brand-white border-brand-blue shadow-[1.5px_1.5px_0px_#f58a2d]"
                          : "bg-brand-white border-brand-blue hover:bg-brand-grey/25 shadow-[1.5px_1.5px_0px_rgba(17,54,105,0.15)]"
                      }`}
                    >
                      <span className="font-mono uppercase tracking-wider font-bold">{langName}</span>
                      <span className={`font-mono text-[8px] px-2 py-0.5 border uppercase font-bold ${
                        isSelected
                          ? "bg-brand-white/20 border-brand-white/40 text-brand-white"
                          : langConfig.dir === "rtl"
                            ? "bg-brand-orange/10 text-brand-orange border-brand-orange/20"
                            : "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                      }`}>
                        {langConfig.dir.toUpperCase()}
                      </span>
                    </button>
                  );
                })}

                {filteredLangs.length === 0 && (
                  <div className="p-6 text-center text-brand-blue/50 text-xs font-semibold">
                    {isRtl ? "لم يتم العثور على نتائج" : "No results found"}
                  </div>
                )}
              </div>

              <div className="p-4 border-t-2 border-brand-blue bg-brand-bg/50">
                <button
                  onClick={handleClose}
                  className="h-9 w-full border-2 border-brand-blue bg-brand-blue text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-orange hover:text-brand-blue transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  style={{ backgroundColor: 'var(--adv-btn-bg)', color: 'var(--adv-btn-text)' }}
                >
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
