"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createMenuItem, toggleMenuItemAvailability, updateMenuItem, updateTenantLanguages, translateText, deleteMenuItem } from "@/app/actions";
import { Globe, Lock, X, Trash2 } from "lucide-react";

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

interface Tenant {
  id: string;
  tier: "free" | "pro" | "enterprise";
  languagesJson?: string | null;
  customMenuLimit?: number | null;
  customLimits?: { free: number; pro: number; enterprise: number };
}

const menuTranslations = {
  English: {
    title: "Menu Management",
    subtitle: "Add, update, and manage your restaurant's digital menu cards.",
    formTitle: "Add Menu Item",
    nameEnLabel: "English Name",
    nameArLabel: "الاسم (عربي)",
    priceLabel: "Price (EGP)",
    categoryLabel: "Category",
    descEnLabel: "English Description",
    descArLabel: "الوصف (عربي)",
    imageLabel: "Item Image",
    uploading: "UPLOADING...",
    uploadBtn: "SELECT FILE",
    submitBtn: "SAVE ITEM",
    updateBtn: "UPDATE ITEM",
    submitting: "SAVING...",
    editFormTitle: "Edit Menu Item",
    cancelBtn: "CANCEL",
    successUpdate: "Menu item updated successfully!",
    limitWarningFree: "You have reached the maximum limit of 5 menu items for the Free tier.",
    limitWarningPro: "You have reached the maximum limit of 30 menu items for the Pro tier.",
    limitWarningEnt: "You have reached the maximum limit of 100 menu items for the Enterprise tier.",
    menuHeader: "Menu Listings",
    emptyState: "No items in your menu yet. Add your first item using the form.",
    successImg: "Image uploaded successfully!",
    errorImg: "Failed to upload image.",
    errorR2: "Error uploading image to R2.",
    successCreate: "Menu item created successfully!",
    errorFields: "Name and price are required.",
    usage: "Usage",
    itemsUnit: "items",
    availability: "Availability Status",
    general: "General",
  },
  Arabic: {
    title: "إدارة قائمة الطعام",
    subtitle: "إضافة وتعديل وإدارة أصناف قائمة طعامك الرقمية.",
    formTitle: "إضافة صنف جديد",
    nameEnLabel: "الاسم بالإنجليزية",
    nameArLabel: "الاسم بالعربية",
    priceLabel: "السعر (جنيه)",
    categoryLabel: "الفئة",
    descEnLabel: "الوصف بالإنجليزية",
    descArLabel: "الوصف بالعربية",
    imageLabel: "صورة الصنف",
    uploading: "جاري الرفع...",
    uploadBtn: "اختر ملف",
    submitBtn: "حفظ الصنف",
    updateBtn: "تحديث الصنف",
    submitting: "جاري الحفظ...",
    editFormTitle: "تعديل الصنف",
    cancelBtn: "إلغاء",
    successUpdate: "تم تحديث الصنف بنجاح!",
    limitWarningFree: "لقد وصلت للحد الأقصى البالغ 5 أصناف في الخطة المجانية.",
    limitWarningPro: "لقد وصلت للحد الأقصى البالغ 30 صنف في الخطة الاحترافية.",
    limitWarningEnt: "لقد وصلت للحد الأقصى البالغ 100 صنف في خطة المؤسسات.",
    menuHeader: "قائمة الأصناف الحالية",
    emptyState: "لا توجد أصناف في قائمتك بعد. أضف صنفك الأول باستخدام النموذج.",
    successImg: "تم رفع الصورة بنجاح!",
    errorImg: "فشل رفع الصورة.",
    errorR2: "خطأ في رفع الصورة إلى R2.",
    successCreate: "تم إضافة صنف القائمة بنجاح!",
    errorFields: "الاسم والسعر حقول مطلوبة.",
    usage: "الاستخدام",
    itemsUnit: "أصناف",
    availability: "حالة التوفر",
    general: "عام",
  },
};

function getLangDir(langName: string, configuredDir: "ltr" | "rtl"): "ltr" | "rtl" {
  const rtlLangs = ["arabic", "hebrew", "persian", "farsi", "urdu", "yiddish", "syriac", "dhivehi", "العربية", "فارسی", "اردو", "עברית"];
  if (rtlLangs.includes(langName.toLowerCase())) {
    return "rtl";
  }
  const ltrLangs = ["polish", "english", "french", "german", "spanish", "italian", "portuguese", "russian", "chinese", "japanese", "korean", "polski", "pl"];
  if (ltrLangs.includes(langName.toLowerCase())) {
    return "ltr";
  }
  return configuredDir;
}

export default function MenuClient({
  initialItems,
  tenant,
  lang = "English",
  userRole = "owner",
}: {
  initialItems: MenuItem[];
  tenant: Tenant;
  lang?: string;
  userRole?: string;
}) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const isRtl = lang === "Arabic";
  const t = menuTranslations[lang === "Arabic" ? "Arabic" : "English"];

  const [secondaryLanguages, setSecondaryLanguages] = useState<Array<{ name: string; dir: "rtl" | "ltr" }>>(() => {
    try {
      const parsed = tenant.languagesJson ? JSON.parse(tenant.languagesJson) : [];
      return parsed.map((l: any) => ({
        name: l.name,
        dir: getLangDir(l.name, l.dir)
      }));
    } catch {
      return [];
    }
  });

  const [selectedLangsForItem, setSelectedLangsForItem] = useState<string[]>([]);

  useEffect(() => {
    if (!editingItem) {
      setSelectedLangsForItem(secondaryLanguages.map(l => l.name));
    }
  }, [editingItem, secondaryLanguages]);

  const [newLangName, setNewLangName] = useState("");
  const [newLangDir, setNewLangDir] = useState<"ltr" | "rtl">("ltr");
  const [showLanguagesConfig, setShowLanguagesConfig] = useState(false);
  const [showDirectionGuide, setShowDirectionGuide] = useState(false);
  const [showManageAllLangs, setShowManageAllLangs] = useState(false);
  const [searchLangQuery, setSearchLangQuery] = useState("");

  const formRef = useRef<HTMLDivElement>(null);
  const [showSelectLangsForItem, setShowSelectLangsForItem] = useState(false);
  const [searchLangForItemQuery, setSearchLangForItemQuery] = useState("");
  const [translatingFields, setTranslatingFields] = useState<Record<string, boolean>>({});

  const handleTranslateField = async (targetFieldName: string, sourceFieldName: string, targetLangName: string) => {
    const sourceEl = document.querySelector(`[name="${sourceFieldName}"]`) as HTMLInputElement | HTMLTextAreaElement;
    const sourceText = sourceEl?.value?.trim() || "";
    if (!sourceText) {
      alert(isRtl ? "الرجاء إدخال النص باللغة الإنجليزية أولاً للترجمة." : "Please enter the English text first to translate.");
      return;
    }

    setTranslatingFields(prev => ({ ...prev, [targetFieldName]: true }));
    const res = await translateText(sourceText, targetLangName);
    setTranslatingFields(prev => ({ ...prev, [targetFieldName]: false }));

    if (res.error) {
      alert(res.error);
    } else if (res.success && res.translatedText) {
      const targetEl = document.querySelector(`[name="${targetFieldName}"]`) as HTMLInputElement | HTMLTextAreaElement;
      if (targetEl) {
        targetEl.value = res.translatedText;
      }
    }
  };

  function parseSecondaryValues(rawText: string | null): Record<string, string> {
    if (!rawText) return {};
    const trimmed = rawText.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as Array<{ lang: string; val: string; dir: "rtl" | "ltr" }>;
        const result: Record<string, string> = {};
        for (const item of parsed) {
          result[item.lang] = item.val;
        }
        return result;
      } catch {
        // ignore
      }
    }
    // Backward compatibility fallback (legacy Arabic name/desc)
    return { "Arabic": trimmed };
  }

  function formatDisplayTranslations(rawText: string | null): string {
    if (!rawText) return "";
    const trimmed = rawText.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as Array<{ lang: string; val: string; dir: "rtl" | "ltr" }>;
        return parsed
          .filter(item => item.val && item.val.trim() !== "")
          .map(item => `${item.lang}: ${item.val}`)
          .join(" | ");
      } catch {
        // ignore
      }
    }
    return rawText;
  }

  const handleAddLanguage = () => {
    const trimmed = newLangName.trim();
    if (!trimmed) return;
    if (secondaryLanguages.some(l => l.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("Language already exists");
      return;
    }
    const updated = [...secondaryLanguages, { name: trimmed, dir: newLangDir }];
    setSecondaryLanguages(updated);
    setNewLangName("");
    
    startTransition(async () => {
      await updateTenantLanguages(tenant.id, updated);
    });
  };

  const handleRemoveLanguage = (langName: string) => {
    const updated = secondaryLanguages.filter(l => l.name !== langName);
    setSecondaryLanguages(updated);
    
    startTransition(async () => {
      await updateTenantLanguages(tenant.id, updated);
    });
  };
  const limits = tenant.customLimits || { free: 5, pro: 30, enterprise: 100 };
  const limitMax = tenant.customMenuLimit !== null && tenant.customMenuLimit !== undefined
    ? tenant.customMenuLimit
    : (tenant.tier === "free" ? limits.free : tenant.tier === "pro" ? limits.pro : limits.enterprise);
  const isLimitReached = items.length >= limitMax;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    // Load dynamic WebP conversion module
    const { convertToWebP } = await import("@/lib/image-utils");

    let uploadFile: File | Blob = file;
    try {
      uploadFile = await convertToWebP(file);
    } catch (webpErr) {
      console.warn("Client-side WebP conversion failed, using original file:", webpErr);
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile, "menu-item.webp");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setImageUrl(data.url);
        setMessage({ type: "success", text: t.successImg });
      } else {
        setMessage({ type: "error", text: data.error || t.errorImg });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: t.errorR2 });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImageUrl(item.imageUrl || "");
    
    // Parse secondary languages present in the item
    const parsed = parseSecondaryValues(item.nameAr);
    // Select languages that are both present in parsed values and configured in secondaryLanguages
    const activeLangs = secondaryLanguages
      .filter(langItem => langItem.name in parsed)
      .map(langItem => langItem.name);
    setSelectedLangsForItem(activeLangs);

    setMessage(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setImageUrl("");
    setSelectedLangsForItem(secondaryLanguages.map(l => l.name));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem && isLimitReached) {
      const warningMsg = lang === "Arabic"
        ? `لقد وصلت للحد الأقصى البالغ ${limitMax} صنف في هذه الخطة.`
        : `You have reached the maximum limit of ${limitMax} menu items for this tier.`;
      setMessage({
        type: "error",
        text: warningMsg,
      });
      return;
    }

    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const nameEn = (formData.get("nameEn") as string) || "";
    const descriptionEn = (formData.get("descriptionEn") as string) || "";
    const priceEgp = parseFloat(formData.get("priceEgp") as string);
    const category = formData.get("category") as string;

    const secondaryNames: Array<{ lang: string; val: string; dir: "rtl" | "ltr" }> = [];
    const secondaryDescs: Array<{ lang: string; val: string; dir: "rtl" | "ltr" }> = [];

    for (const langItem of secondaryLanguages) {
      if (selectedLangsForItem.includes(langItem.name)) {
        const nameVal = (formData.get(`name_${langItem.name}`) as string) || "";
        const descVal = (formData.get(`desc_${langItem.name}`) as string) || "";
        secondaryNames.push({ lang: langItem.name, val: nameVal.trim(), dir: langItem.dir });
        secondaryDescs.push({ lang: langItem.name, val: descVal.trim(), dir: langItem.dir });
      }
    }

    const nameAr = JSON.stringify(secondaryNames);
    const descriptionAr = JSON.stringify(secondaryDescs);

    if (!nameEn.trim() || isNaN(priceEgp)) {
      setMessage({ type: "error", text: t.errorFields });
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateMenuItem(editingItem.id, {
          nameEn,
          nameAr,
          descriptionEn,
          descriptionAr,
          priceEgp,
          category,
          imageUrl,
        });

        if (res.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setMessage({ type: "success", text: t.successUpdate });
          form.reset();
          setImageUrl("");
          setEditingItem(null);

          setItems(items.map(item => item.id === editingItem.id ? {
            ...item,
            nameEn,
            nameAr,
            descriptionEn,
            descriptionAr,
            price: Math.round(priceEgp * 100),
            category,
            imageUrl: imageUrl || null,
          } : item));
        }
      } else {
        const res = await createMenuItem({
          tenantId: tenant.id,
          nameEn,
          nameAr,
          descriptionEn,
          descriptionAr,
          priceEgp,
          category,
          imageUrl,
        });

        if (res.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setMessage({ type: "success", text: t.successCreate });
          form.reset();
          setImageUrl("");
          
          const newItem: MenuItem = {
            id: Math.random().toString(),
            nameEn,
            nameAr,
            descriptionEn,
            descriptionAr,
            price: Math.round(priceEgp * 100),
            currency: "EGP",
            category,
            imageUrl: imageUrl || null,
            isAvailable: true,
          };
          setItems([newItem, ...items]);
        }
      }
    });
  };

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    const updatedStatus = !currentStatus;
    setItems(items.map(item => item.id === itemId ? { ...item, isAvailable: updatedStatus } : item));

    const res = await toggleMenuItemAvailability(itemId, updatedStatus);
    if (res.error) {
      setItems(items.map(item => item.id === itemId ? { ...item, isAvailable: currentStatus } : item));
      setMessage({ type: "error", text: res.error });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(lang === "Arabic" ? "هل أنت متاكد من حذف هذا الصنف؟" : "Are you sure you want to delete this menu item?")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteMenuItem(itemId);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setItems(items.filter(item => item.id !== itemId));
        setMessage({ type: "success", text: lang === "Arabic" ? "تم حذف الصنف بنجاح" : "Menu item deleted successfully" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-10">
      {/* ─── Header Info & Tier Counter ──────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669]">
        <div>
          <h2 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">{t.title}</h2>
          <p className="text-brand-blue/70 text-xs mt-1 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-xs font-bold text-brand-blue">
            {t.usage}: <strong className="text-brand-orange">{items.length}</strong> /{" "}
            {limitMax} {t.itemsUnit}
          </span>
          <div className="w-36 bg-brand-bg border border-brand-blue h-3 mt-2 overflow-hidden shadow-[1px_1px_0px_#113669]">
            <div
              className={`h-full transition-all duration-300 ${
                isLimitReached ? "bg-brand-orange" : "bg-brand-blue"
              }`}
              style={{ width: `${Math.min((items.length / limitMax) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 text-xs font-bold flex items-start gap-2 border-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
              : "bg-rose-50 border-rose-500 text-rose-800"
          }`}
        >
          <span>
            {message.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </span>
          <p>{message.text}</p>
        </div>
      )}

      {/* ─── Grid: Form & List ───────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Form Container */}
        {userRole !== "viewer" && (
          <div ref={formRef} className="lg:col-span-5 p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669] lg:sticky lg:top-28 min-w-0">
            
            {/* Project Languages Configuration Widget */}
            <div className="border-b-2 border-brand-blue pb-4 mb-6">
              <button
                type="button"
                onClick={() => setShowLanguagesConfig(!showLanguagesConfig)}
                className="w-full flex items-center justify-between font-display font-black text-xs text-brand-blue uppercase tracking-wider cursor-pointer select-none focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span>{isRtl ? "لغات المنيو" : "Menu Languages"}</span>
                </div>
                <span className="font-mono text-[9px] font-black text-brand-orange uppercase tracking-wider border-2 border-brand-blue bg-brand-bg px-2 py-0.5 shadow-[1.5px_1.5px_0px_#113669] transition-all group-hover:translate-x-[0.5px] group-hover:translate-y-[0.5px] group-hover:shadow-[1px_1px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                  {showLanguagesConfig 
                    ? (isRtl ? "إخفاء" : "Hide") 
                    : (isRtl ? "عرض" : "Show")}
                </span>
              </button>

              {showLanguagesConfig && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col gap-3">
                  <p className="text-brand-blue/50 text-[10px] font-semibold">
                    {isRtl 
                      ? "تحديد اللغات الإضافية التي ترغب في دعمها في قائمة طعامك الرقمية." 
                      : "Specify additional languages you want to translate your menu into."}
                  </p>

                  {/* Active Languages Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-1 items-center">
                    <span className="px-2 py-0.5 border border-brand-blue bg-brand-grey/25 font-mono text-[9px] font-bold text-brand-blue uppercase tracking-wider">
                      English (Primary)
                    </span>
                    {secondaryLanguages.length <= 2 ? (
                      secondaryLanguages.map((langItem, idx) => (
                        <div key={idx} className="flex items-center border border-brand-blue bg-brand-white shadow-[1px_1px_0px_#113669]">
                          <span className="px-2 py-0.5 font-mono text-[9px] font-bold text-brand-blue uppercase tracking-wider">
                            {langItem.name} ({langItem.dir.toUpperCase()})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(langItem.name)}
                            className="px-1.5 py-0.5 border-l border-brand-blue text-brand-orange hover:bg-brand-orange hover:text-brand-white font-mono text-[9px] font-black cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <>
                        {secondaryLanguages.slice(0, 2).map((langItem, idx) => (
                          <div key={idx} className="flex items-center border border-brand-blue bg-brand-white shadow-[1px_1px_0px_#113669]">
                            <span className="px-2 py-0.5 font-mono text-[9px] font-bold text-brand-blue uppercase tracking-wider">
                              {langItem.name} ({langItem.dir.toUpperCase()})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLanguage(langItem.name)}
                              className="px-1.5 py-0.5 border-l border-brand-blue text-brand-orange hover:bg-brand-orange hover:text-brand-white font-mono text-[9px] font-black cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowManageAllLangs(true)}
                          className="px-2 py-0.5 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#113669] hover:bg-brand-blue hover:text-brand-white transition-all cursor-pointer hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                          + {secondaryLanguages.length - 2} {isRtl ? "المزيد / إدارة الكل" : "More / Manage"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Add Secondary Language Form */}
                  <div className="flex flex-col gap-2 bg-brand-bg/15 p-3 border border-brand-blue/15 shadow-[1px_1px_0px_rgba(17,54,105,0.05)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">{isRtl ? "اسم اللغة" : "Language Name"}</label>
                        <input
                          type="text"
                          placeholder={isRtl ? "الرجاء إدخال اسم اللغة هنا..." : "ENTER LANGUAGE NAME HERE"}
                          value={newLangName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewLangName(val);
                            const rtlLangs = ["arabic", "hebrew", "persian", "farsi", "urdu", "yiddish", "syriac", "dhivehi", "العربية", "فارسی", "اردو", "עברית"];
                            if (rtlLangs.includes(val.trim().toLowerCase())) {
                              setNewLangDir("rtl");
                            } else {
                              setNewLangDir("ltr");
                            }
                          }}
                          className="h-8 px-2 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">{isRtl ? "اتجاه النص" : "Direction"}</label>
                          <button
                            type="button"
                            onClick={() => setShowDirectionGuide(!showDirectionGuide)}
                            className="font-mono text-[8px] font-bold text-brand-orange hover:underline uppercase cursor-pointer"
                          >
                            {showDirectionGuide ? (isRtl ? "[إغلاق الدليل]" : "[Close Guide]") : (isRtl ? "[دليل الاتجاه]" : "[View Guide]")}
                          </button>
                        </div>
                        <div className="flex border-2 border-brand-blue bg-brand-white h-8 w-full">
                          <button
                            type="button"
                            onClick={() => setNewLangDir("ltr")}
                            className={`flex-1 text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                              newLangDir === "ltr"
                                ? "bg-brand-blue text-brand-white font-black"
                                : "text-brand-blue hover:bg-brand-grey/30 font-semibold"
                            }`}
                          >
                            LTR
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewLangDir("rtl")}
                            className={`flex-1 text-[9px] font-black tracking-wider uppercase transition-all border-l-2 border-brand-blue cursor-pointer ${
                              newLangDir === "rtl"
                                ? "bg-brand-blue text-brand-white font-black"
                                : "text-brand-blue hover:bg-brand-grey/30 font-semibold"
                            }`}
                          >
                            RTL
                          </button>
                        </div>
                      </div>
                    </div>

                    {showDirectionGuide && (
                      <div className="text-[9px] border-2 border-dashed border-brand-blue/30 bg-brand-white p-3 font-medium space-y-2 mt-1 leading-relaxed text-brand-blue select-none">
                        <div className="space-y-1">
                          <p className="font-black text-brand-orange">
                            {isRtl ? "اتجاه من اليسار إلى اليمين (LTR):" : "Left-to-Right (LTR):"}
                          </p>
                          <p className="text-brand-blue/70">
                            {isRtl
                              ? "تدفق النص يبدأ من اليسار ويتجه لليمين. يُستخدم لغالبية اللغات."
                              : "Text flows left to right. Used for most global languages."}
                          </p>
                          <p className="font-mono font-bold text-[8px] text-brand-blue/50">
                            {isRtl ? "أمثلة: الإنجليزية، الفرنسية، الألمانية، الإسبانية." : "Examples: English, French, Spanish, German, Italian."}
                          </p>
                        </div>
                        <div className="space-y-1 border-t border-brand-blue/10 pt-2">
                          <p className="font-black text-brand-orange">
                            {isRtl ? "اتجاه من اليمين إلى اليسار (RTL):" : "Right-to-Left (RTL):"}
                          </p>
                          <p className="text-brand-blue/70">
                            {isRtl
                              ? "تدفق النص يبدأ من اليمين ويتجه لليسار. يُستخدم لعدد من اللغات الإقليمية."
                              : "Text flows right to left. Used for regional languages."}
                          </p>
                          <p className="font-mono font-bold text-[8px] text-brand-blue/50">
                            {isRtl ? "أمثلة: العربية، العبرية، الفارسية، الأردية." : "Examples: Arabic, Hebrew, Persian (Farsi), Urdu."}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      {tenant.tier === "free" && secondaryLanguages.length >= 1 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-brand-orange text-brand-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-brand-blue shadow-[1.5px_1.5px_0px_#113669]">
                            PRO
                          </span>
                          <span className="text-[9px] text-brand-orange font-bold leading-none">
                            {isRtl ? "الخطة المجانية تقتصر على لغة واحدة فقط" : "Free allows 1 secondary language"}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}
                      <button
                        type="button"
                        onClick={handleAddLanguage}
                        disabled={
                          !newLangName.trim() ||
                          (tenant.tier === "free" && secondaryLanguages.length >= 1) ||
                          (tenant.tier === "pro" && secondaryLanguages.length >= 50)
                        }
                        className="h-8 px-3 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[9px] uppercase tracking-wider font-black border-2 border-brand-blue transition-all cursor-pointer shadow-[2px_2px_0px_#f58a2d] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + {isRtl ? "إضافة" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider mb-6 flex items-center gap-2">
              {editingItem ? (
                <>
                  <svg className="w-4 h-4 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>{t.editFormTitle}</span>
                </>
              ) : (
                <>
                  <span>{t.formTitle}</span>
                </>
              )}
            </h3>
          
          <form key={editingItem?.id || 'new'} onSubmit={handleSubmit} method="POST" className="flex flex-col gap-4">
            
            {/* Translate to other languages selector */}
            {secondaryLanguages.length > 0 && (
              <div className="flex flex-col gap-2 p-3 bg-brand-bg/15 border-2 border-brand-blue/30 shadow-[2px_2px_0px_#113669]">
                <label className="font-mono text-[9px] font-bold text-brand-blue uppercase tracking-widest">
                  {isRtl ? "ترجمة هذا الصنف إلى:" : "Translate this item to:"}
                </label>
                <div className="flex flex-wrap gap-4 mt-1 items-center">
                  {secondaryLanguages.length <= 2 ? (
                    secondaryLanguages.map((langItem) => {
                      const isChecked = selectedLangsForItem.includes(langItem.name);
                      return (
                        <label key={langItem.name} className="flex items-center gap-2 cursor-pointer font-sans text-xs text-brand-blue font-semibold">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLangsForItem([...selectedLangsForItem, langItem.name]);
                              } else {
                                setSelectedLangsForItem(selectedLangsForItem.filter(name => name !== langItem.name));
                              }
                            }}
                            className="accent-brand-orange w-4 h-4 cursor-pointer"
                          />
                          <span>{langItem.name}</span>
                        </label>
                      );
                    })
                  ) : (
                    <>
                      {secondaryLanguages.slice(0, 2).map((langItem) => {
                        const isChecked = selectedLangsForItem.includes(langItem.name);
                        return (
                          <label key={langItem.name} className="flex items-center gap-2 cursor-pointer font-sans text-xs text-brand-blue font-semibold">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLangsForItem([...selectedLangsForItem, langItem.name]);
                                } else {
                                  setSelectedLangsForItem(selectedLangsForItem.filter(name => name !== langItem.name));
                                }
                              }}
                              className="accent-brand-orange w-4 h-4 cursor-pointer"
                            />
                            <span>{langItem.name}</span>
                          </label>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowSelectLangsForItem(true)}
                        className="px-2 py-0.5 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#113669] hover:bg-brand-blue hover:text-brand-white transition-all cursor-pointer hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        + {secondaryLanguages.length - 2} {isRtl ? "المزيد / تحديد" : "More / Select"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Primary Language Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">{t.nameEnLabel}</label>
              <input
                name="nameEn"
                type="text"
                required
                defaultValue={editingItem?.nameEn || ""}
                placeholder={isRtl ? "الرجاء إدخال اسم العنصر هنا..." : "ENTER ITEM NAME HERE"}
                className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs w-full min-w-0"
              />
            </div>

            {/* Dynamic Secondary Languages Name Inputs */}
            {secondaryLanguages
              .filter(langItem => selectedLangsForItem.includes(langItem.name))
              .map((langItem, idx) => {
                const values = editingItem ? parseSecondaryValues(editingItem.nameAr) : {};
                const defaultValue = values[langItem.name] || "";
                const langDir = getLangDir(langItem.name, langItem.dir);
                const fieldName = `name_${langItem.name}`;
                return (
                  <div key={idx} className="flex flex-col gap-1.5" dir={langDir}>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <label className={`font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest ${langDir === "rtl" ? "text-right" : ""}`}>
                        {isRtl ? `الاسم باللغة ${langItem.name}` : `${langItem.name.toUpperCase()} NAME`}
                      </label>
                      <button
                        type="button"
                        disabled={translatingFields[fieldName]}
                        onClick={() => handleTranslateField(fieldName, "nameEn", langItem.name)}
                        className="font-mono text-[8px] font-bold text-brand-orange hover:underline uppercase tracking-wider cursor-pointer disabled:opacity-50 select-none"
                      >
                        {translatingFields[fieldName]
                          ? (isRtl ? "جاري الترجمة..." : "Translating...")
                          : (isRtl ? "🪄 ترجمة تلقائية" : "🪄 Auto-Translate")}
                      </button>
                    </div>
                    <input
                      name={fieldName}
                      type="text"
                      defaultValue={defaultValue}
                      placeholder={isRtl ? `الرجاء إدخال الاسم باللغة ${langItem.name} هنا...` : `ENTER ${langItem.name.toUpperCase()} NAME HERE`}
                      className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs w-full min-w-0"
                    />
                  </div>
                );
              })}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">{t.priceLabel}</label>
                <input
                  name="priceEgp"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingItem ? (editingItem.price / 100).toFixed(2) : ""}
                  placeholder="ENTER PRICE HERE"
                  className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-mono font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">{t.categoryLabel}</label>
                <input
                  name="category"
                  type="text"
                  defaultValue={editingItem?.category || ""}
                  placeholder="ENTER CATEGORY HERE"
                  className="h-10 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs w-full min-w-0"
                />
              </div>
            </div>

            {/* Primary Language Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">{t.descEnLabel}</label>
              <textarea
                name="descriptionEn"
                rows={2}
                defaultValue={editingItem?.descriptionEn || ""}
                placeholder={isRtl ? "الرجاء إدخال الوصف باللغة الإنجليزية هنا..." : "ENTER ENGLISH DESCRIPTION HERE"}
                className="p-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs resize-none font-semibold w-full min-w-0"
              />
            </div>

            {/* Dynamic Secondary Languages Description Inputs */}
            {secondaryLanguages
              .filter(langItem => selectedLangsForItem.includes(langItem.name))
              .map((langItem, idx) => {
                const values = editingItem ? parseSecondaryValues(editingItem.descriptionAr) : {};
                const defaultValue = values[langItem.name] || "";
                const langDir = getLangDir(langItem.name, langItem.dir);
                const fieldName = `desc_${langItem.name}`;
                return (
                  <div key={idx} className="flex flex-col gap-1.5" dir={langDir}>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <label className={`font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest ${langDir === "rtl" ? "text-right" : ""}`}>
                        {isRtl ? `الوصف باللغة ${langItem.name}` : `${langItem.name.toUpperCase()} DESCRIPTION`}
                      </label>
                      <button
                        type="button"
                        disabled={translatingFields[fieldName]}
                        onClick={() => handleTranslateField(fieldName, "descriptionEn", langItem.name)}
                        className="font-mono text-[8px] font-bold text-brand-orange hover:underline uppercase tracking-wider cursor-pointer disabled:opacity-50 select-none"
                      >
                        {translatingFields[fieldName]
                          ? (isRtl ? "جاري الترجمة..." : "Translating...")
                          : (isRtl ? "🪄 ترجمة تلقائية" : "🪄 Auto-Translate")}
                      </button>
                    </div>
                    <textarea
                      name={fieldName}
                      rows={2}
                      defaultValue={defaultValue}
                      placeholder={isRtl ? `الرجاء إدخال الوصف باللغة ${langItem.name} هنا...` : `ENTER ${langItem.name.toUpperCase()} DESCRIPTION HERE`}
                      className="p-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs resize-none font-semibold w-full min-w-0"
                    />
                  </div>
                );
              })}

            {/* Media Upload Element */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">{t.imageLabel}</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center h-10 px-4 border-2 border-brand-blue bg-brand-grey hover:bg-brand-orange text-brand-blue hover:text-brand-white font-mono text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0">
                  {uploading ? t.uploading : t.uploadBtn}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading || isLimitReached}
                  />
                </label>
                {imageUrl && (
                  <div className="relative w-10 h-10 border border-brand-blue overflow-hidden shadow-[1px_1px_0px_#113669]">
                    <img src={imageUrl} alt="Uploaded item" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-3">
              <button
                type="submit"
                disabled={isPending || uploading || (!editingItem && isLimitReached)}
                className="flex-1 h-11 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? t.submitting : (editingItem ? t.updateBtn : t.submitBtn)}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isPending || uploading}
                  className="w-1/3 h-11 bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
              )}
            </div>
          </form>
          </div>
        )}

        {/* List Container */}
        <div className={userRole === "viewer" ? "lg:col-span-12 flex flex-col gap-5" : "lg:col-span-7 flex flex-col gap-5"}>
          <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>{t.menuHeader}</span>
          </h3>

          {items.length === 0 ? (
            <div className="p-12 text-center bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
              <svg className="w-12 h-12 text-brand-blue/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <p className="text-brand-blue/80 text-xs font-semibold">{t.emptyState}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((item, index) => {
                const isLocked = index >= limitMax;

                if (isLocked) {
                  return (
                    <div
                      key={item.id}
                      className="relative p-5 bg-amber-50/50 border-2 border-amber-400 border-dashed shadow-[4px_4px_0px_#113669] flex flex-col justify-between gap-4 transition-all duration-200 min-w-0"
                    >
                      <div className="flex gap-4 opacity-70">
                        {item.imageUrl ? (
                          <div className="relative w-16 h-16 border-2 border-amber-400 overflow-hidden shrink-0 shadow-[2px_2px_0px_#113669] grayscale">
                            <img
                              src={item.imageUrl}
                              alt={item.nameEn}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-800 shrink-0 shadow-[2px_2px_0px_#113669]">
                            <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                              {item.category || t.general}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white font-mono text-[8px] font-black uppercase shadow-[1px_1px_0px_#113669]">
                              <Lock className="w-2.5 h-2.5" />
                              {lang === "Arabic" ? "مقفل" : "Locked"}
                            </span>
                          </div>
                          <h4 className="font-display font-black text-brand-blue text-sm uppercase mt-0.5 truncate">{item.nameEn}</h4>
                          <h4 className="font-sans font-bold text-brand-blue/60 text-xs truncate">
                            {formatDisplayTranslations(item.nameAr)}
                          </h4>
                          <span className="font-mono text-emerald-600 font-bold text-xs mt-1.5">
                            {(item.price / 100).toFixed(2)} EGP
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-300 pt-3">
                        <a
                          href={`/project/${tenant.id}/bocado/plans`}
                          className="flex items-center gap-1.5 px-3 py-1 bg-brand-orange hover:bg-brand-white hover:text-brand-blue text-brand-white border-2 border-brand-blue font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                        >
                          <span>{lang === "Arabic" ? "ترقية الخطة للفتح" : "Upgrade Plan to Unlock"}</span>
                        </a>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={userRole === "viewer"}
                          className="flex items-center gap-1 px-2.5 py-1 border-2 border-rose-500 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white font-mono text-[10px] font-bold uppercase transition-all shadow-[2px_2px_0px_#113669] cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{lang === "Arabic" ? "حذف" : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="p-5 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669] flex flex-col justify-between gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#113669] transition-all duration-200 min-w-0"
                  >
                    <div className="flex gap-4">
                      {item.imageUrl ? (
                        <div className="relative w-16 h-16 border-2 border-brand-blue overflow-hidden shrink-0 shadow-[2px_2px_0px_#113669]">
                          <img
                            src={item.imageUrl}
                            alt={item.nameEn}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-brand-bg border-2 border-brand-blue flex items-center justify-center text-brand-blue shrink-0 shadow-[2px_2px_0px_#113669]">
                          <svg className="w-6 h-6 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-widest">
                          {item.category || t.general}
                        </span>
                        <h4 className="font-display font-black text-brand-blue text-sm uppercase mt-0.5 truncate">{item.nameEn}</h4>
                        <h4 className="font-sans font-bold text-brand-blue/60 text-xs truncate">
                          {formatDisplayTranslations(item.nameAr)}
                        </h4>
                        <span className="font-mono text-emerald-600 font-bold text-xs mt-1.5">
                          {(item.price / 100).toFixed(2)} EGP
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-blue/20 pt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={userRole === "viewer"}
                          className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-brand-blue hover:text-brand-orange uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={userRole === "viewer"}
                          className="flex items-center gap-1 font-mono text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete menu item"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-brand-blue/60 uppercase">{t.availability}</span>
                        <button
                          onClick={() => handleToggle(item.id, item.isAvailable)}
                          disabled={userRole === "viewer"}
                          className={`w-12 h-6 border-2 border-brand-blue transition-all duration-200 ${
                            item.isAvailable ? "bg-brand-orange" : "bg-brand-bg"
                          } ${userRole === "viewer" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div
                            className={`w-4 h-4 border border-brand-blue bg-brand-white transition-all duration-200 ${
                              item.isAvailable ? "translate-x-6 rtl:translate-x-[-24px]" : "translate-x-1"
                            }`}
                          ></div>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Secondary Languages Management Modal Overlay ─── */}
      {showManageAllLangs && (() => {
        const queryLower = searchLangQuery.toLowerCase().trim();
        const showPrimary = !queryLower || "english".includes(queryLower);
        const filteredSecondary = secondaryLanguages.filter(l => 
          l.name.toLowerCase().includes(queryLower)
        );
        const handleClose = () => {
          setShowManageAllLangs(false);
          setSearchLangQuery("");
        };

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-100">
            <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-md w-full shadow-[8px_8px_0px_#113669] flex flex-col gap-4 text-brand-blue text-start">
              <div className="flex items-center justify-between border-b-2 border-brand-blue pb-3">
                <h3 className="font-display font-black text-sm uppercase tracking-wider">
                  {isRtl ? "إدارة لغات المنيو" : "Manage Menu Languages"}
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
                  value={searchLangQuery}
                  onChange={(e) => setSearchLangQuery(e.target.value)}
                  placeholder={isRtl ? "ابحث عن لغة..." : "ENTER LANGUAGE TO SEARCH HERE"}
                  className="w-full h-9 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue text-xs font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 border-2 border-brand-blue/15 bg-brand-bg/5 p-2">
                {/* Primary Language */}
                {showPrimary && (
                  <div className="flex items-center justify-between p-2.5 bg-brand-grey/25 border border-brand-blue/30 font-semibold text-xs">
                    <span className="font-mono uppercase tracking-wider font-bold">English</span>
                    <span className="font-mono text-[9px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 border border-brand-blue/20 uppercase font-bold">
                      {isRtl ? "أساسية (LTR)" : "Primary (LTR)"}
                    </span>
                  </div>
                )}

                {/* Secondary Languages List */}
                {filteredSecondary.map((langItem, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-brand-white border border-brand-blue shadow-[1.5px_1.5px_0px_rgba(17,54,105,0.15)] text-xs">
                    <span className="font-mono uppercase tracking-wider font-bold">{langItem.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[8px] px-2 py-0.5 border uppercase font-bold ${
                        langItem.dir === "rtl" 
                          ? "bg-brand-orange/10 text-brand-orange border-brand-orange/20" 
                          : "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                      }`}>
                        {langItem.dir.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(langItem.name)}
                        className="px-2 py-1 border border-rose-600 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-brand-white font-mono text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer"
                      >
                        {isRtl ? "حذف" : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}

                {!showPrimary && filteredSecondary.length === 0 && (
                  <div className="p-6 text-center text-brand-blue/50 text-xs font-semibold">
                    {isRtl ? "لم يتم العثور على نتائج" : "No results found"}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="h-9 w-full border-2 border-brand-blue bg-brand-blue text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-orange hover:text-brand-blue transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {isRtl ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ─── Item Languages Selection Modal Overlay ─── */}
      {showSelectLangsForItem && (() => {
        const queryLower = searchLangForItemQuery.toLowerCase().trim();
        const filteredSecondary = secondaryLanguages.filter(l => 
          l.name.toLowerCase().includes(queryLower)
        );
        const handleClose = () => {
          setShowSelectLangsForItem(false);
          setSearchLangForItemQuery("");
        };

        const handleSelectAll = () => {
          const namesToSelect = filteredSecondary.map(l => l.name);
          const union = Array.from(new Set([...selectedLangsForItem, ...namesToSelect]));
          setSelectedLangsForItem(union);
        };

        const handleUnselectAll = () => {
          const namesToRemove = filteredSecondary.map(l => l.name);
          setSelectedLangsForItem(selectedLangsForItem.filter(name => !namesToRemove.includes(name)));
        };

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-100">
            <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-md w-full shadow-[8px_8px_0px_#113669] flex flex-col gap-4 text-brand-blue text-start">
              <div className="flex items-center justify-between border-b-2 border-brand-blue pb-3">
                <h3 className="font-display font-black text-sm uppercase tracking-wider">
                  {isRtl ? "تحديد لغات ترجمة الصنف" : "Translate Item To"}
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
                  value={searchLangForItemQuery}
                  onChange={(e) => setSearchLangForItemQuery(e.target.value)}
                  placeholder={isRtl ? "ابحث عن لغة..." : "ENTER LANGUAGE TO SEARCH HERE"}
                  className="w-full h-9 px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue text-xs font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all"
                />
              </div>

              {/* Select / Unselect Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex-1 py-1.5 border-2 border-brand-blue bg-brand-grey/20 hover:bg-brand-orange hover:text-brand-white font-mono text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer shadow-[1.5px_1.5px_0px_#113669] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  {isRtl ? "تحديد الكل" : "Select All"}
                </button>
                <button
                  type="button"
                  onClick={handleUnselectAll}
                  className="flex-1 py-1.5 border-2 border-brand-blue bg-brand-grey/20 hover:bg-brand-orange hover:text-brand-white font-mono text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer shadow-[1.5px_1.5px_0px_#113669] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  {isRtl ? "إلغاء التحديد" : "Unselect All"}
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 border-2 border-brand-blue/15 bg-brand-bg/5 p-2">
                {filteredSecondary.map((langItem) => {
                  const isChecked = selectedLangsForItem.includes(langItem.name);
                  return (
                    <label
                      key={langItem.name}
                      className="flex items-center justify-between p-2.5 bg-brand-white border border-brand-blue shadow-[1.5px_1.5px_0px_rgba(17,54,105,0.15)] text-xs cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLangsForItem([...selectedLangsForItem, langItem.name]);
                            } else {
                              setSelectedLangsForItem(selectedLangsForItem.filter(name => name !== langItem.name));
                            }
                          }}
                          className="accent-brand-orange w-4 h-4 cursor-pointer"
                        />
                        <span className="font-mono uppercase tracking-wider font-bold">{langItem.name}</span>
                      </div>
                      <span className={`font-mono text-[8px] px-2 py-0.5 border uppercase font-bold ${
                        langItem.dir === "rtl" 
                          ? "bg-brand-orange/10 text-brand-orange border-brand-orange/20" 
                          : "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                      }`}>
                        {langItem.dir.toUpperCase()}
                      </span>
                    </label>
                  );
                })}

                {filteredSecondary.length === 0 && (
                  <div className="p-6 text-center text-brand-blue/50 text-xs font-semibold">
                    {isRtl ? "لم يتم العثور على نتائج" : "No results found"}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="h-9 w-full border-2 border-brand-blue bg-brand-blue text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-orange hover:text-brand-blue transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {isRtl ? "تأكيد وإغلاق" : "Confirm & Close"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
