export interface ServiceTranslation {
  title: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  deliverable: string;
}

export interface LanguageTranslations {
  navbar: {
    home: string;
    services: string;
    estimator: string;
    benefitBtn: string;
    sectorLabel: string;
    menuLabel: string;
    langRegion: string;
  };
  hero: {
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
  servicesGrid: {
    badge: string;
    title: string;
    desc: string;
    deliverableLabel: string;
    featuresLabel: string;
    closeBtn: string;
    exploreMore: string;
    servicesList: {
      "social-setup": ServiceTranslation;
      "social-management": ServiceTranslation;
      "web-dev": ServiceTranslation;
      "seo-optimization": ServiceTranslation;
    };
  };
  contactForm: {
    badge: string;
    title: string;
    desc: string;
    formHeading: string;
    formSubheading: string;
    fieldName: string;
    fieldEmail: string;
    fieldMessage: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderMessage: string;
    fieldContactMethod: string;
    contactMethodOptions: {
      email: string;
      whatsapp: string;
      phone: string;
      telegram: string;
      linkedin: string;
      skype: string;
      "microsoft-teams": string;
    };
    fieldContactDetail: string;
    placeholderContactDetail: {
      whatsapp: string;
      phone: string;
      telegram: string;
      linkedin: string;
      skype: string;
      "microsoft-teams": string;
    };
    btnSubmit: string;
    btnSubmitting: string;
    successHeading: string;
    successDesc: string;
    btnSubmitAnother: string;
  };
  footer: {
    desc: string;
    navHeading: string;
    contactHeading: string;
    labelInquiries: string;
    labelHub: string;
    labelHours: string;
    valueHub: string;
    valueHours: string;
    copyright: string;
    privacyTerms: string;
    cookieSetup: string;
    backToTop: string;
  };
}

const en: LanguageTranslations = {
  navbar: {
    home: "Home",
    services: "Services",
    estimator: "Form",
    benefitBtn: "Sign Up",
    sectorLabel: "Sector",
    menuLabel: "Menu",
    langRegion: "Language & Region"
  },
  hero: {
    bgAgency: "PLATFORM",
    headlineStart: "MULTI-PROJECT",
    headlineMid: "& DIGITAL",
    headlineMid2: "STOREFRONT",
    headlineEnd: "ENGINES.",
    paragraph: "Jozelio is a unified multi-tenant SaaS console that empowers you to instantiate dynamic storefronts, manage digital menus, track real-time kitchen orders, and coordinate team access across multiple business brands instantly.",
    ctaBenefit: "LAUNCH YOUR PROJECT",
    ctaExplore: "Explore Platform",
    growthEngine: "SaaS Engine",
    weHelp: "Launch and scale your restaurant online"
  },
  servicesGrid: {
    badge: "01 / Platform Core Wings",
    title: "Unified Operations for Multi-Brand SaaS",
    desc: "We build cohesive multi-tenant workflows. Configure physical locations, set up interactive storefront domains, manage dynamic digital menus, and process real-time orders.",
    deliverableLabel: "Integration Scope:",
    featuresLabel: "Key Features:",
    closeBtn: "Close Panel",
    exploreMore: "Explore Capabilities & Features",
    servicesList: {
      "social-setup": {
        title: "Multi-Project Brand Hub",
        shortDesc: "Launch and coordinate multiple business projects. Switch between scoped brand subdomains instantly from a single console.",
        longDesc: "Every brand is unique. Instantly deploy dynamic custom subdomains, configure physical store coordinates, map custom colors, and set up metadata settings from your unified user hub.",
        features: [
          "Bespoke subdomain provisioning (e.g. pizza.jozelio.com)",
          "Unified main project grid cards and wizard settings",
          "Dedicated R2 assets upload hooks (brand logo inputs)",
          "Adaptive English/Arabic direction translations per project"
        ],
        deliverable: "Unlimited storefront workspaces, dynamic subdomains, and branding cards."
      },
      "social-management": {
        title: "Dynamic Digital Menu Builder",
        shortDesc: "Add menu categories, edit dish names, upload food pictures, and switch item availability status in real-time.",
        longDesc: "Your menu is your restaurant's engine. Update item titles and details (in bilingual English & Arabic), modify currency pricing units, set custom category tags, and toggle availability instantly.",
        features: [
          "Bilingual English/Arabic item descriptions",
          "One-click availability switch controls",
          "Direct-to-R2 image upload streamers",
          "Pricing unit compliance (Piastres/Cents currency filters)"
        ],
        deliverable: "Dynamic menu catalog manager and automated storefront sync."
      },
      "web-dev": {
        title: "Live KDS Kitchen Orders Tracker",
        shortDesc: "Monitor orders in real-time. Instantly update status pipelines from Preparing to Ready and Completed.",
        longDesc: "Coordinate your kitchen operations seamlessly. Receive customer orders automatically on a dedicated visual KDS console, view customized item lines and notes, and complete orders with single-click triggers.",
        features: [
          "Real-time visual order board layouts",
          "One-tap stage transitions (Pending, Preparing, Ready, Delivered)",
          "Complete order details (phone, customer name, notes)",
          "Monthly usage constraints for Free Tiers (limit 10 orders)"
        ],
        deliverable: "Real-time kitchen display tracking dashboard and live storefront pipelines."
      },
      "seo-optimization": {
        title: "Team Roles & Collaboration",
        shortDesc: "Invite team members by email and assign permissions (Admin, Manager, Viewer) with localized mail alerts.",
        longDesc: "Scale operations by coordinating with your team. Invite team members to collaborate on menu items or orders, define custom permission levels, and receive dynamic invitations inside the header console.",
        features: [
          "Granular role permissions: Admin, Manager, Viewer (Read-only)",
          "Header message notification bell with real-time counters",
          "Clean team member roster logs with cancel/revoke features",
          "Automatic invitation acceptance and secure binding"
        ],
        deliverable: "Secure team roles engine and real-time invitation notifications."
      }
    }
  },
  contactForm: {
    badge: "04 / Inquire & Elevate",
    title: "Benefit From Jozelio",
    desc: "Let us design bespoke software platforms, streamline critical business pipelines, and deploy custom social media campaigns optimized for your market segment. Fill out our operational inquiry form below.",
    formHeading: "Let's Launch Together",
    formSubheading: "Sign up the form and benefit from Jozelio",
    fieldName: "Your Full Name *",
    fieldEmail: "Work Email Address *",
    fieldMessage: "Your Message / Brief Details *",
    placeholderName: "ENTER FULL NAME HERE",
    placeholderEmail: "ENTER WORK EMAIL HERE",
    placeholderMessage: "ENTER MESSAGE DETAILS HERE",
    fieldContactMethod: "Preferred Contact Method *",
    contactMethodOptions: {
      email: "Email",
      whatsapp: "WhatsApp",
      phone: "Phone Call",
      telegram: "Telegram",
      linkedin: "LinkedIn",
      skype: "Skype",
      "microsoft-teams": "Microsoft Teams"
    },
    fieldContactDetail: "Your Contact Details *",
    placeholderContactDetail: {
      whatsapp: "Please enter your WhatsApp number here...",
      phone: "Please enter your phone number here...",
      telegram: "Please enter your Telegram username or phone number here...",
      linkedin: "Please enter your LinkedIn profile URL here...",
      skype: "Please enter your Skype ID here...",
      "microsoft-teams": "Please enter your Microsoft Teams email address here..."
    },
    btnSubmit: "Submit",
    btnSubmitting: "Submitting...",
    successHeading: "Inquiry Deposited",
    successDesc: "Excellent choice! We have received your parameters and operational sector info. An onboarding specialist from Jozelio will reach out via email within 12 business hours.",
    btnSubmitAnother: "Submit Another Inquiry"
  },
  footer: {
    desc: "We design aesthetic brand platforms and engineer high-performance web applications, uniting brand-voice consistency and cutting-edge tech underneath one unified growth engine.",
    navHeading: "Navigation",
    contactHeading: "Contact Jozelio",
    labelInquiries: "Inquiries",
    labelHub: "Service Area",
    labelHours: "Support Hours",
    valueHub: "Worldwide (Remote-First)",
    valueHours: "Monday – Friday, 9:00 AM – 6:00 PM GMT",
    copyright: "© 2026 JOZELIO Marketing Wing. All rights reserved.",
    privacyTerms: "Privacy Terms",
    cookieSetup: "Cookie Setup",
    backToTop: "Back to Top"
  }
};

const ar: LanguageTranslations = {
  navbar: {
    home: "الرئيسية",
    services: "الخدمات",
    estimator: "النموذج",
    benefitBtn: "أنشئ حساباً",
    sectorLabel: "القطاع",
    menuLabel: "القائمة",
    langRegion: "اللغة والمنطقة"
  },
  hero: {
    bgAgency: "منصة",
    headlineStart: "منصة سحابية",
    headlineMid: "متعددة",
    headlineMid2: "المشاريع",
    headlineEnd: "والمتاجر الرقمية.",
    paragraph: "جوزيليو هي منصة سحابية قوية متعددة المشاريع تمكنك من إنشاء متاجر إلكترونية ديناميكية، وإدارة قوائم الطعام الرقمية، وتتبع طلبات المطبخ في الوقت الفعلي، وتنسيق وصول فريق العمل عبر العديد من العلامات التجارية على الفور.",
    ctaBenefit: "أطلق مشروعك الرقمي",
    ctaExplore: "استكشف المنصة",
    growthEngine: "محرك سحابي",
    weHelp: "أطلق وقشر مطعمك الرقمي عبر الإنترنت"
  },
  servicesGrid: {
    badge: "٠١ / قدرات المنصة",
    title: "عمليات موحدة لإدارة العلامات التجارية المتعددة",
    desc: "نحن نبني مساحات عمل سحابية متكاملة. قم بتهيئة مواقع العمل الجغرافية، وإنشاء نطاقات فرعية تفاعلية، وإدارة قوائم الطعام، وتتبع الطلبات المباشرة في الوقت الفعلي.",
    deliverableLabel: "نطاق التكامل:",
    featuresLabel: "الميزات الرئيسية:",
    closeBtn: "إغلاق اللوحة",
    exploreMore: "استكشف القدرات والميزات",
    servicesList: {
      "social-setup": {
        title: "مركز المشاريع المتعددة",
        shortDesc: "أطلق ونسق مشاريع تجارية متعددة. تنقل بين نطاقات الهوية الفرعية للمشروع على الفور من لوحة تحكم موحدة.",
        longDesc: "لكل علامة تجارية طابعها الخاص. قم بنشر نطاقات فرعية ديناميكية مخصصة على الفور، وتهيئة إحداثيات المتجر الجغرافية، وتحديد شعار الهوية، وتنسيق الإعدادات من مركزك الموحد.",
        features: [
          "تخصيص وحجز نطاقات فرعية فورية (مثل: pizza.jozelio.com)",
          "لوحة تحكم مركزية لعرض المشاريع وإضافة إعدادات جديدة",
          "روابط رفع أصول صور شعار الهوية مباشرة إلى Cloudflare R2",
          "اتجاهات ترجمة ذكية متوافقة مع اللغة العربية والإنجليزية"
        ],
        deliverable: "مساحات عمل غير محدودة للمتاجر، ونطاقات فرعية نشطة، وبطاقات الهوية."
      },
      "social-management": {
        title: "مستعرض قوائم الطعام الرقمية",
        shortDesc: "أضف فئات الأصناف، وحرر الأسماء، وارفع صور المأكولات، وتحكم في توفر العناصر بالقائمة في الوقت الفعلي.",
        longDesc: "قائمتك هي قلب مطعمك الرقمي. قم بتحديث أسماء وتفاصيل المأكولات (بصيغ ثنائية اللغة: العربية والإنجليزية)، وتعديل العملة والأسعار، وتصنيف الأقسام، وتبديل حالة التوفر فوراً.",
        features: [
          "توصيف الأصناف بلغة ثنائية (العربية والإنجليزية) متكاملة",
          "أزرار تبديل بنقرة واحدة لحالة توفر الأصناف بالقائمة",
          "رفع الصور والوسائط مباشرة إلى مخزن R2 السحابي",
          "حساب متوافق مع أصغر فئات العملات (القروش والسينتات)"
        ],
        deliverable: "مستعرض قوائم طعام ديناميكي ومزامنة فورية مع متجر العملاء."
      },
      "web-dev": {
        title: "نظام شاشات المطبخ (KDS)",
        shortDesc: "تتبع حالة الطلبات بالوقت الفعلي. حدّث مسار التحضير فوراً من قيد الانتظار إلى قاري التحضير والتوصيل.",
        longDesc: "نسق عمليات مطبخك بسلاسة كاملة. استقبل طلبات العملاء تلقائياً على شاشة KDS المخصصة للمطبخ، واطلع على تفاصيل الأصناف والملاحظات، وأكمل المعالجة بنقرة زر واحدة.",
        features: [
          "شاشات طلبات تفاعلية بتحديث فوري وتلقائي",
          "تحديث بنقرة واحدة لحالات الطلبات (انتظار، تحضير، جاهز، تم التوصيل)",
          "تفاصيل كاملة لكل طلب تشمل هاتف العميل، الاسم، والملاحظات",
          "تتبع حصص الطلبات الشهرية وحظر تجاوز الحد للخطة المجانية"
        ],
        deliverable: "شاشات عرض المطبخ التفاعلية ومسارات ربط المتجر الفورية."
      },
      "seo-optimization": {
        title: "أدوار الفريق والصلاحيات",
        shortDesc: "ادعُ أعضاء فريق العمل عبر بريدهم الإلكتروني وحدد أدوار الصلاحيات (مسؤول، مدير، مشاهد) مع تنبيهات دعوة فورية.",
        longDesc: "وسع نطاق أعمالك بالتنسيق مع فريقك. ادعُ المساهمين لإدارة قوائم الطعام أو تتبع طلبات المطبخ، وحدد مستوى الوصول، واستعرض دعوات الإدارة الجديدة عبر أيقونة الرسائل بالهيدر.",
        features: [
          "صلاحيات وصول دقيقة تشمل: مسؤول (كامل)، مدير (كتابة)، مشاهد (قراءة)",
          "مركز إشعارات في الهيدر مع عدادات وتنبيهات دعوات فورية",
          "قائمة أعضاء سهلة الإدارة مع خيار إلغاء الدعوة أو إلغاء الوصول",
          "قبول الدعوات والربط التلقائي والآمن للمستخدمين"
        ],
        deliverable: "نظام تحكم بالصلاحيات والأدوار، وتنبيهات إشعارات دعوة فورية."
      }
    }
  },
  contactForm: {
    badge: "04 / استفسر وارتقِ",
    title: "استفد من جوزيليو",
    desc: "دعنا نصمم منصات برمجية مخصصة، ونقوم بتبسيط خطوط العمل الحيوية، وننشر حملات وسائل التواصل الاجتماعي المخصصة والمحسّنة لشريحة السوق الخاصة بك. املأ نموذج الاستفسار التشغيلي أدناه.",
    formHeading: "دعونا ننطلق معًا",
    formSubheading: "سجل في النموذج واستفد من جوزيليو",
    fieldName: "الاسم الكامل الخاص بك *",
    fieldEmail: "عنوان البريد الإلكتروني للعمل *",
    fieldMessage: "رسالتك / تفاصيل موجزة *",
    placeholderName: "الرجاء إدخال الاسم الكامل هنا...",
    placeholderEmail: "الرجاء إدخال البريد الإلكتروني للعمل هنا...",
    placeholderMessage: "الرجاء إدخال الرسالة أو التفاصيل هنا...",
    fieldContactMethod: "طريقة التواصل المفضلة *",
    contactMethodOptions: {
      email: "البريد الإلكتروني",
      whatsapp: "واتساب",
      phone: "مكالمة هاتفية",
      telegram: "تيليجرام",
      linkedin: "لينكد إن",
      skype: "سكايب",
      "microsoft-teams": "مايكروسوفت تيمز"
    },
    fieldContactDetail: "تفاصيل التواصل الخاصة بك *",
    placeholderContactDetail: {
      whatsapp: "الرجاء إدخال رقم واتساب هنا...",
      phone: "الرجاء إدخال رقم الهاتف هنا...",
      telegram: "الرجاء إدخال معرّف أو رقم تيليجرام هنا...",
      linkedin: "الرجاء إدخال رابط ملف لينكد إن هنا...",
      skype: "الرجاء إدخال معرّف سكايب هنا...",
      "microsoft-teams": "الرجاء إدخال البريد الإلكتروني لمايكروسوفت تيمز هنا..."
    },
    btnSubmit: "إرسال",
    btnSubmitting: "جاري الإرسال...",
    successHeading: "تم إرسال الاستفسار",
    successDesc: "اختيار ممتاز! لقد تلقينا معطياتك ومعلومات قطاعك التشغيلي. سيتواصل معك أخصائي من جوزيليو عبر البريد الإلكتروني في غضون ١٢ ساعة عمل.",
    btnSubmitAnother: "تقديم استفسار آخر"
  },
  footer: {
    desc: "نحن نصمم منصات علامات تجارية جمالية ونقوم بهندسة تطبيقات ويب عالية الأداء، ونجمع بين اتساق نبرة العلامة التجارية والتكنولوجيا المتطورة تحت محرك نمو موحد.",
    navHeading: "التنقل",
    contactHeading: "اتصل بجوزيليو",
    labelInquiries: "الاستفسارات",
    labelHub: "نطاق الخدمة",
    labelHours: "ساعات الدعم",
    valueHub: "في جميع أنحاء العالم (العمل عن بعد)",
    valueHours: "الاثنين – الجمعة، ٩:٠٠ صباحًا – ٦:٠٠ مساءً بتوقيت غرينتش",
    copyright: "© ٢٠٢٦ جناح جوزيليو للتسويق. جميع الحقوق محفوظة.",
    privacyTerms: "شروط الخصوصية",
    cookieSetup: "إعداد ملفات الكوكيز",
    backToTop: "العودة إلى الأعلى"
  }
};

export const translations: Record<string, LanguageTranslations> = {
  English: en,
  Arabic: ar,
};
