"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, FileText, Cookie, Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import Footer from "@/components/Footer";

type TabId = "terms" | "privacy" | "cookies" | "disclaimer";

function LegalHubContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("terms");
  const [lang, setLang] = useState<string>("English");

  useEffect(() => {
    const savedLang = localStorage.getItem("jozelio_language") || "English";
    setLang(savedLang);
    const isRtl = savedLang === "Arabic";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = isRtl ? "ar" : "en";
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabId;
    if (tabParam && ["terms", "privacy", "cookies", "disclaimer"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const isAr = lang === "Arabic";

  const tabs = [
    { id: "terms" as TabId, label: isAr ? "شروط الخدمة" : "Terms of Service", icon: FileText },
    { id: "privacy" as TabId, label: isAr ? "سياسة الخصوصية" : "Privacy Policy", icon: ShieldAlert },
    { id: "cookies" as TabId, label: isAr ? "سياسة الكوكيز" : "Cookie Policy", icon: Cookie },
    { id: "disclaimer" as TabId, label: isAr ? "إخلاء المسؤولية" : "Disclaimer & Liability", icon: Scale },
  ];

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-blue font-sans selection:bg-brand-orange/30 selection:text-brand-orange" dir={isAr ? "rtl" : "ltr"}>
      {/* Top Navbar */}
      <header className="sticky top-0 bg-brand-bg/90 backdrop-blur-md border-b-2 border-brand-blue py-4 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <BrandLogo size="md" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-blue px-4 py-2 font-mono text-xs font-black uppercase tracking-wider transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#113669] cursor-pointer text-center"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {isAr ? "العودة للرئيسية" : "Back To Home"}
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12 text-center md:text-start">
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-brand-blue leading-none mb-4">
            {isAr ? "مركز الامتثال القانوني" : "Legal Compliance Hub"}
          </h1>
          <p className="text-sm font-medium text-brand-blue/70 max-w-2xl leading-relaxed">
            {isAr 
              ? "يرجى قراءة شروطنا وسياساتنا وإخلاء المسؤولية بعناية. تشكل هذه الوثائق اتفاقيات قانونية ملزمة تحكم استخدامك لمنصة جوزيليو السحابية."
              : "Please read our Terms, Policies, and Disclaimers carefully. These documents constitute binding legal agreements governing your use of the Jozelio SaaS Platform."}
          </p>
        </div>

        {/* Modular Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tab Navigation Sidebar */}
          <nav className="lg:col-span-4 flex flex-col gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-start p-4 border-2 font-mono text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-brand-blue text-brand-white border-brand-blue shadow-[4px_4px_0px_#f58a2d] -translate-x-[2px] -translate-y-[2px]"
                      : "bg-brand-white text-brand-blue border-brand-blue hover:bg-brand-orange/15 shadow-[2px_2px_0px_#113669]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
                  <span>{isAr ? "◀" : "▶"}</span>
                </button>
              );
            })}

            <div className="mt-8 p-5 border-2 border-dashed border-brand-blue/30 bg-brand-white/40 space-y-3">
              <h4 className="font-mono text-[10px] font-black uppercase text-brand-blue/60 tracking-wider">
                {isAr ? "هل تحتاج لدعم قانوني؟" : "Need legal support?"}
              </h4>
              <p className="text-[11px] leading-relaxed text-brand-blue/70">
                {isAr ? (
                  <>
                    للأسئلة المتعلقة بهذه السياسات، اتصل بمكتب الامتثال القانوني لدينا على{" "}
                    <a href="mailto:growth@jozelio.com" className="underline text-brand-orange font-bold hover:text-brand-blue transition-colors">
                      growth@jozelio.com
                    </a>.
                  </>
                ) : (
                  <>
                    For questions regarding these policies, contact our legal and compliance desk at{" "}
                    <a href="mailto:growth@jozelio.com" className="underline text-brand-orange font-bold hover:text-brand-blue transition-colors">
                      growth@jozelio.com
                    </a>.
                  </>
                )}
              </p>
            </div>
          </nav>

          {/* Legal Document Container */}
          <article className="lg:col-span-8 bg-brand-white border-4 border-brand-blue p-8 md:p-10 shadow-[8px_8px_0px_#113669] text-brand-blue max-w-none prose prose-blue prose-sm overflow-hidden text-start">
            {activeTab === "terms" && (
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-wider bg-brand-blue/5 border border-brand-blue/15 px-2 py-1">
                    {isAr ? "آخر تحديث: ١٦ يوليو ٢٠٢٦" : "Last Updated: July 16, 2026"}
                  </span>
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-brand-blue mt-4">
                    {isAr ? "شروط الخدمة" : "Terms of Service"}
                  </h2>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-brand-blue/80 font-medium">
                  {isAr ? (
                    <>
                      <p>
                        مرحبًا بك في جوزيليو. من خلال الوصول إلى منصتنا السحابية (المشار إليها باسم &quot;المنصة&quot; أو &quot;الخدمات&quot;)، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام المنصة.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ١. وصف الخدمة
                      </h3>
                      <p>
                        جوزيليو هو تطبيق برمجيات كخدمة (SaaS) يتيح للعملاء إعداد واستضافة وإدارة واجهات المتاجر الرقمية الفرعية وقوائم الأصناف وقوائم المأكولات الرقمية. نحن نوفر البنية التحتية البرمجية فقط. ولا يُعتبر جوزيليو بائعًا أو تاجرًا مسجلاً لأي معاملة أو منتج أو خدمة يتم بيعها من خلال واجهات المتاجر التي ينشئها المستخدمون.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٢. أهلية المستخدم والتزامات الحساب
                      </h3>
                      <p>
                        يجب ألا يقل عمرك عن ١٨ عامًا لتسجيل حساب. وتوافق على تقديم معلومات تسجيل دقيقة وكاملة وحالية. وأنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات اعتماد حسابك وعن جميع الأنشطة التي تحدث تحت حسابك.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٣. السلوك المحظور ومسؤوليات التجار
                      </h3>
                      <p>
                        بصفتك مستخدمًا، فإنك توافق على عدم رفع أو استضافة أو بيع أي منتجات أو عناصر تخالف القوانين المحلية، أو تنتهك حقوق الملكية الفكرية، أو تروج للأسلحة أو المواد المحظورة أو عمليات الاحتيال. وأنت مسؤول بالكامل عن ضمان توافق متجرك وأسعارك ومعاملاتك والضرائب وسياسات الاسترجاع مع القوانين واللوائح المعمول بها في منطقتك.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٤. إدارة المنصة، والتعليق، والإنهاء
                      </h3>
                      <p>
                        يحتفظ مسؤولو ومالكو جوزيليو بالحق المطلق، وفقًا لتقديرهم الخاص ودون إشعار مسبق أو مسؤولية قانونية، في تعليق أو حظر أو إلغاء تنشيط أو تقييد أو حذف أي حساب مستخدم أو متجر يخالف هذه الشروط أو يشكل خطرًا قانونيًا أو أمنيًا على المنصة.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٥. قانون وحماية حقوق المؤلف (DMCA)
                      </h3>
                      <p>
                        نحن نحترم الملكية الفكرية للآخرين. إذا كنت تعتقد أن هناك محتوى ينتهك حقوق الطبع والنشر الخاصة بك في أي متجر مستضاف لدينا، يرجى إرسال إشعار تفصيلي إلى بريدنا القانوني <span className="font-semibold text-brand-orange">growth@jozelio.com</span> يحتوي على توقيعك ووصف العمل المنتهك ورابط المتجر المخالف وبيانات الاتصال بك.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٦. اللغة الحاكمة
                      </h3>
                      <p>
                        تمت صياغة هذه الاتفاقية باللغة الإنجليزية. وفي حال وجود أي تعارض أو اختلاف بين النسخة الإنجليزية وأي نسخة مترجمة أخرى، فإن النسخة الإنجليزية هي التي تسري وتعتمد حصريًا.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Welcome to Jozelio. By accessing or using our SaaS platform (the &quot;Platform&quot; or &quot;Services&quot;), you (&quot;User&quot;, &quot;Merchant&quot; or &quot;Customer&quot;) agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Platform.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        1. Description of Service
                      </h3>
                      <p>
                        Jozelio is a software-as-a-service application that allows customers to configure, host, and manage digital subdomain storefronts, catalog items, digital menu listings, and associated platform communications. We supply the software infrastructure only. Jozelio is not a vendor, seller, or merchant of record for any transaction, product, or service sold through user-created storefronts.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        2. User Eligibility and Account Obligations
                      </h3>
                      <p>
                        You must be at least 18 years of age to register an account. You agree to provide accurate, current, and complete registration info. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        3. Prohibited Conduct and Merchant Responsibilities
                      </h3>
                      <p>
                        As a user, you agree that you will not upload, host, list, or sell catalog storefront items that are illegal, infringe upon intellectual property rights, promote weapons, regulated substances, explicit adult materials, fraudulent schemes, or are otherwise prohibited by applicable local laws. You are solely responsible for ensuring your storefront, product descriptions, transaction terms, local taxation, and consumer refund policies comply fully with local laws and regulations.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        4. Platform Administration, Suspension, & Termination
                      </h3>
                      <p>
                        Jozelio administrators and owners reserve the absolute right, in their sole discretion and without prior notice or liability, to suspend, ban, deactivate, restrict, or permanently delete any user account or storefront that violates these Terms, receives security/abuse reports, fails to process billing fees, or poses a reputation or legal risk to the Platform.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        5. DMCA / Intellectual Property Takedown Policy
                      </h3>
                      <p>
                        We respect the intellectual property of others. If you believe your copyrighted work has been infringed by a storefront hosted on Jozelio, please send a detailed takedown notification to our legal desk at <span className="font-semibold text-brand-orange">growth@jozelio.com</span> including: (a) physical or electronic signature of the copyright owner; (b) identification of the copyrighted work claimed to be infringed; (c) precise link/URL of the infringing storefront on our system; and (d) your direct contact information.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        6. Governing Language
                      </h3>
                      <p>
                        This agreement is executed and written in English. In the event of any conflict, discrepancy, or dispute arising between the English version and any translated locale version of these terms, the English version shall exclusively control and govern.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-wider bg-brand-blue/5 border border-brand-blue/15 px-2 py-1">
                    {isAr ? "آخر تحديث: ١٦ يوليو ٢٠٢٦" : "Last Updated: July 16, 2026"}
                  </span>
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-brand-blue mt-4">
                    {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                  </h2>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-brand-blue/80 font-medium">
                  {isAr ? (
                    <>
                      <p>
                        توضح سياسة الخصوصية هذه كيفية جمع بياناتك الشخصية وبيانات تعريف المتاجر وتخزينها ومعالجتها وحمايتها في منصة جوزيليو.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ١. المعلومات التي نجمعها
                      </h3>
                      <p>
                        نحن نجمع البيانات الشخصية الضرورية لتقديم خدماتنا:
                      </p>
                      <ul className="list-disc pr-5 space-y-1">
                        <li><strong>بيانات التسجيل</strong>: الاسم، البريد الإلكتروني، كلمة المرور المشفرة، اسم المستخدم، أرقام الهواتف، وتفاصيل الملف الشخصي.</li>
                        <li><strong>بيانات المتجر</strong>: اسم النشاط التجاري، النطاق الفرعي، تفاصيل المنتجات، الأسعار، وصور القائمة.</li>
                        <li><strong>بيانات النظام والاتصال</strong>: عناوين IP، نوع المتصفح، طابع الوقت، رموز الجلسة، والبيانات الوصفية للعمليات.</li>
                        <li><strong>بيانات التحقق</strong>: رموز Cloudflare Turnstile المستخدمة لفحص الحسابات البرمجية والآلية الضارة.</li>
                      </ul>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٢. كيف نستخدم معلوماتك
                      </h3>
                      <p>
                        يتم استخدام البيانات المجمعة لأغراض محددة:
                      </p>
                      <ul className="list-disc pr-5 space-y-1">
                        <li>إعداد واستضافة وتأمين المتاجر الرقمية الفرعية الخاصة بالمستخدمين.</li>
                        <li>فرض سياسات الأمان والتحقق من حالات تسجيل الدخول ومعالجة طلبات الدعم.</li>
                        <li>إرسال رسائل البريد الإلكتروني وتنبيهات المشاريع عبر خدمة Resend.</li>
                        <li>منع الهجمات الإلكترونية وحظر طلبات التسجيل الآلية والبريد العشوائي.</li>
                      </ul>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٣. مشاركة البيانات ونقلها
                      </h3>
                      <p>
                        لا تقوم منصة جوزيليو ببيع أو مبادلة أو توزيع أي بيانات شخصية للمستخدمين لجهات تسويق أو أطراف خارجية. نحن نشارك البيانات فقط مع خدمات البنية التحتية الأساسية لتشغيل الـ SaaS (مثل Cloudflare للتوجيه، وResend لإرسال البريد الإلكتروني، وقواعد بيانات D1 لمعالجة الاستعلامات).
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٤. الاحتفاظ بالبيانات وحقوقك القانونية
                      </h3>
                      <p>
                        نحتفظ ببياناتك طالما أن حسابك نشط. وتمتلك الحقوق القانونية الكاملة لمعاينة بياناتك أو تعديلها أو تقييدها أو طلب حذفها بالكامل من خوادمنا. لإجراء ذلك، يرجى مراسلتنا مباشرة.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This Privacy Policy outlines how Jozelio collects, stores, processes, and protects personal data and user storefront metadata.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        1. Information We Collect
                      </h3>
                      <p>
                        We collect personal information necessary to deliver our Services:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Registration Data</strong>: Name, email address, password hash, username, phone numbers, and profile details.</li>
                        <li><strong>Storefront Information</strong>: Business name, subdomains, catalog item details, descriptions, pricing, and catalog images.</li>
                        <li><strong>System Telemetry</strong>: IP addresses, user-agent details, access timestamps, session tokens, and database query metadata.</li>
                        <li><strong>Verification Data</strong>: Cloudflare Turnstile token signals used to screen for bot interactions.</li>
                      </ul>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        2. How We Use Information
                      </h3>
                      <p>
                        Collected data is processed for specific purposes:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Configuring, securing, and hosting user digital storefronts.</li>
                        <li>Enforcing operator security policies, validating authentication states, and processing support tickets.</li>
                        <li>Sending transactional emails and project status notifications via Resend.</li>
                        <li>Preventing malicious bot attacks, code injection attempts, and platform abuse.</li>
                      </ul>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        3. Data Transfer and Third-Party Sharing
                      </h3>
                      <p>
                        Jozelio does not sell, trade, or distribute user personal details to third-party data brokers. We share data only with core sub-processors necessary to run the SaaS infrastructure (e.g. Cloudflare for edge routing, Resend for email delivery, and D1 SQLite database processing).
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        4. Data Retention and Rights
                      </h3>
                      <p>
                        We retain data as long as your account remains active. You possess the legal rights to inspect, update, restrict processing, or request full deletion of your profile data. To invoke these rights, please email us directly.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "cookies" && (
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[9px] font-bold text-brand-orange uppercase tracking-wider bg-brand-blue/5 border border-brand-blue/15 px-2 py-1">
                    {isAr ? "آخر تحديث: ١٦ يوليو ٢٠٢٦" : "Last Updated: July 16, 2026"}
                  </span>
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-brand-blue mt-4">
                    {isAr ? "سياسة الكوكيز" : "Cookie Policy"}
                  </h2>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-brand-blue/80 font-medium">
                  {isAr ? (
                    <>
                      <p>
                        توضح سياسة الكوكيز هذه كيفية استخدام المنصة لملفات تعريف الارتباط وتخزين البيانات محليًا لضمان تشغيل وظائف الموقع الهامة.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ١. ملفات تعريف الارتباط الأساسية
                      </h3>
                      <p>
                        نحن نستخدم ملفات تعريف الارتباط لتحديد هوية الجلسات النشطة (عبر Better-Auth) والتي تضمن بقاءك مسجلاً للدخول أثناء تنقلك بين لوحات تحكم المتاجر والصفحات الداخلية.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٢. حفظ التفضيلات والإعدادات
                      </h3>
                      <p>
                        نحن نستخدم معلمات `localStorage` في المتصفح للحفاظ على تفضيلاتك الجغرافية، مثل الدولة المحددة واللغة النشطة (العربية أو الإنجليزية) لضمان اتساق العرض.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٣. التحقق الأمني من الروبوتات
                      </h3>
                      <p>
                        تعمل نصوص Cloudflare Turnstile على فحص مؤشرات الأمان للتحقق من أنك إنسان حقيقي وتفادي طلبات التسجيل العشوائية المؤتمتة الضارة.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٤. تعطيل ملفات تعريف الارتباط
                      </h3>
                      <p>
                        يمكنك حظر ملفات الكوكيز من إعدادات متصفحك. ومع ذلك، فإن تعطيلها سيؤدي فورًا إلى كسر الجلسة النشطة، مما يمنعك من تسجيل الدخول أو تشغيل لوحة التحكم وإدارة متجرك.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This Cookie Policy explains how the Platform uses cookies and similar client-side local storage mechanisms to guarantee essential site functionality.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        1. Essential Cookies
                      </h3>
                      <p>
                        We use cookies for crucial authentication states and session tokens (via Better-Auth) which ensure you remain logged in as you navigate between your storefront management panel and dashboard components.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        2. Preference & Setting Cookies
                      </h3>
                      <p>
                        We utilize browser `localStorage` parameters to preserve localized preferences, such as your selected country region and bilingual language states (English or Arabic), to provide a consistent visual interface.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        3. Security Verification
                      </h3>
                      <p>
                        Cloudflare Turnstile script runs checking indicators via security parameters to verify that interactions are performed by humans, preventing automated spam signups.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        4. Disabling Cookies
                      </h3>
                      <p>
                        You can restrict cookies via your web browser settings. However, disabling essential cookies will immediately break your session, preventing you from logging in, accessing dashboard tools, or managing your storefronts.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "disclaimer" && (
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-[9px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-1">
                    {isAr ? "إفصاح قانوني هام" : "CRITICAL LEGAL DISCLOSURE"}
                  </span>
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-brand-blue mt-4">
                    {isAr ? "إخلاء المسؤولية وحدودها" : "Disclaimer & Liability Limitations"}
                  </h2>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-brand-blue/80 font-medium">
                  <p className="font-bold text-rose-600 bg-rose-50/50 p-4 border border-rose-100 uppercase tracking-wide">
                    {isAr 
                      ? "يرجى قراءة هذا القسم بعناية فائقة. إنه يحد من مسؤوليتنا القانونية ويؤثر على حقوقك في مقاضاة المنصة بالمحاكم."
                      : "PLEASE READ THIS SECTION WITH EXTREME CARE. IT LIMITS OUR LIABILITY AND AFFECTS YOUR RIGHTS TO PURSUE LITIGATION IN COURT."}
                  </p>

                  {isAr ? (
                    <>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ١. إخلاء المسؤولية عن الضمانات (المنصة مقدمة &quot;كما هي&quot;)
                      </h3>
                      <p className="uppercase">
                        يتم تقديم منصة جوزيليو على أساس &quot;كما هي&quot; و &quot;كما تتوفر&quot;. ونحن نخلي مسؤوليتنا صراحة عن أي ضمانات من أي نوع، سواء كانت صريحة أو ضمنية أو قانونية، بما في ذلك على سبيل المثال لا الحصر الضمانات الضمنية لصلاحية العرض، أو الملاءمة لغرض معين، أو الأمان، أو خلو المنصة من الأخطاء. ولا نضمن تشغيل المنصة دون انقطاع أو خلوها من الاختراقات أو فقدان البيانات.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٢. الحد المطلق للمسؤولية
                      </h3>
                      <p className="uppercase">
                        بأقصى حد يسمح به القانون المعمول به، لا يتحمل جوزيليو أو مالكوه أو مسؤولوها أو موظفوها أو شركاؤها بأي حال من الأحوال المسؤولية عن أي أضرار غير مباشرة أو خاصة أو عرضية أو تبعية أو رادعة، بما في ذلك خسائر الأرباح أو الإيرادات أو البيانات أو قيمة السمعة أو تعطل الأعمال، والناشئة عن استخدامك للمنصة أو عدم قدرتك على استخدامها.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٣. الحد الأقصى للمسؤولية المالية
                      </h3>
                      <p>
                        تحت أي ظرف من الظروف، لن تتجاوز المسؤولية الإجمالية لجوزيليو عن جميع المطالبات الناشئة عن هذه الشروط الحد الأكبر من: (أ) مائة دولار أمريكي (١٠٠٫٠٠ دولار)، أو (ب) إجمالي الرسوم التي دفعتها أنت لجوزيليو خلال الاثني عشر (١٢) شهرًا السابقة للمطالبة.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٤. شرط التعويض
                      </h3>
                      <p>
                        أنت توافق على الدفاع عن جوزيليو ومالكيه ومسؤوليه وتعويضهم وإبراء ذمتهم من أي مطالبات أو دعاوى قضائية أو التزامات أو أضرار أو خسائر أو تكاليف (بما في ذلك أتعاب المحاماة المعقولة) الناشئة عن: (أ) استخدامك للمنصة؛ (ب) أي معاملات أو خلافات بينك وبين عملاء متجرك؛ (ج) المحتوى المعروض بمتجرك؛ أو (د) مخالفتك لهذه الشروط.
                      </p>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        ٥. التحكيم الإلزامي والتنازل عن الدعاوى الجماعية
                      </h3>
                      <p>
                        يتم تسوية أي خلاف أو مطالبة تنشأ عن هذه الشروط حصريًا من خلال التحكيم الفردي الملزم. وتوافق بموجب هذا على التنازل عن أي حق في المشاركة في الدعاوى الجماعية أو المحاكمات أمام هيئات المحلفين. ويجب تقديم جميع المطالبات بصفتك الفردية فقط.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        1. Disclaimer of Warranties (PROVIDED &quot;AS-IS&quot;)
                      </h3>
                      <p className="uppercase">
                        THE JOZELIO PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. WE EXPLICITLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR REPRESENTATIONAL, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, COMPLIANCE, SECURITY, ACCURACY, ERROR-FREE OPERATION, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE PLATFORM WILL ALWAYS OPERATE SAFELY, FREE OF DOWNTIME, ATTACKS, EXPLOITS, OR DATA LOSS.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        2. Absolute Limitation of Liability
                      </h3>
                      <p className="uppercase">
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL JOZELIO, ITS OWNERS, OPERATORS, CO-FOUNDERS, EMPLOYEES, AFFILIATES, OR INFRASTRUCTURE OPERATORS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, OR SPECIAL DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, TRANSACTIONS, BUSINESS INTERRUPTION, CLIENT COMPLAINTS, OR BUSINESS VALUE, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE THE PLATFORM.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        3. Maximum Financial Liability Cap
                      </h3>
                      <p>
                        UNDER NO CIRCUMSTANCES SHALL JOZELIO&apos;S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS OF ANY KIND ARISING FROM OR RELATING TO THESE TERMS EXCEED THE GREATER OF: (A) ONE HUNDRED US DOLLARS ($100.00 USD), OR (B) THE TOTAL FEES PAID BY YOU TO JOZELIO IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        4. Indemnification Clause
                      </h3>
                      <p>
                        You agree to defend, indemnify, and hold harmless Jozelio, its owners, and operators from any and all third-party claims, lawsuits, liabilities, damages, losses, costs, and expenses (including reasonable legal/attorney fees) arising out of: (a) your use of the Platform; (b) any transactions or disputes between you and your storefront customers; (c) content or catalog items you host; or (d) your violation of these Terms.
                      </p>

                      <h3 className="font-mono font-black text-xs uppercase text-brand-blue tracking-wider border-b border-brand-blue/15 pb-1 mt-6">
                        5. Mandatory Arbitration & Class Action Waiver
                      </h3>
                      <p>
                        ANY DISPUTE, CONTROVERSY, OR CLAIM ARISING OUT OF OR RELATING TO THESE TERMS SHALL BE RESOLVED EXCLUSIVELY BY BINDING INDIVIDUAL ARBITRATION. YOU AGREE TO WAIVE ANY RIGHT TO PARTICIPATE IN CLASS-ACTION LAWSUITS, COLLECTIVE ACTIONS, OR JURY TRIALS. ALL CLAIMS MUST BE BROUGHT ONLY IN YOUR INDIVIDUAL CAPACITY.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-blue font-mono font-bold text-xs uppercase">
        Loading Legal Compliance Hub...
      </div>
    }>
      <LegalHubContent />
    </Suspense>
  );
}
