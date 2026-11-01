// ===========================================================================
//  محتوى الصفحة الرئيسية — الملف ده هو اللي بتعدّل فيه العروض والفيديوهات
//  كل نص له نسختين: ar (عربي) و en (إنجليزي)
//  الصور: حطها في مجلد public (مثلاً public/offers/) واكتب مسارها /offers/اسم.png
// ===========================================================================

export type L = { ar: string; en: string };

// لون الكارت: light = فاتح | red = أحمر | navy = كحلي | orange = برتقالي
export type OfferTheme = 'light' | 'red' | 'navy' | 'orange';

// ---------- شرائح البانر المتحرك (الشريحة الأولى هي اللوجو وبتتحط تلقائي) ----------
export type SlidePrice = {
  label?: L; // مثال: { ar: '256 جيجا', en: '256GB' }
  old?: string; // السعر القديم (هيتشطب) مثال: '450 د.ب' — اتركه فاضي لو مفيش خصم
  now: string; // السعر الحالي مثال: '420 د.ب'
};

export type Slide = {
  badge?: L; // شارة صغيرة (مثلاً: عرض لفترة محدودة)
  brand?: string; // اسم الماركة بحروف كبيرة (APPLE)
  title: L;
  subtitle?: L;
  prices?: SlidePrice[]; // لو فاضية مش هتظهر أسعار
  note?: L; // سطر صغير تحت (مثلاً: العرض ساري حتى ...)
  cta: L;
  link: string;
  image?: string; // صورة PNG شفافة للجهاز
  theme: OfferTheme;
};

// ---------- كروت العروض الصغيرة ----------
export type Offer = {
  badge: L;
  title: L;
  subtitle: L;
  cta: L;
  link: string;
  image?: string;
  theme: OfferTheme;
};

// ---------- أماكن الفيديو ----------
export type Showcase = {
  icon: 'phone' | 'audio' | 'watch' | 'laptop';
  title: L;
  subtitle: L;
  cta: L;
  link: string;
  video?: string; // ملف mp4 في public/videos/ مثال: '/videos/iphone.mp4'
  poster?: string; // صورة قبل تشغيل الفيديو
};

export type Strip = {
  badge?: L;
  title: L;
  subtitle: L;
  cta: L;
  link: string;
  image?: string;
  theme: OfferTheme;
};

export const HOME_CONTENT: {
  topBar: L;
  slides: Slide[];
  strip: Strip;
  // خصم كل قسم (بالـ slug بتاعه). لو القسم مش هنا بيظهر "اكتشف العروض".
  // مثال: iphone: { ar: 'حتى 10%', en: 'Up to 10%' }
  savingsDiscounts: Record<string, L>;
  offers: Offer[];
  showcases: Showcase[];
  why: { title: L; subtitle: L };
} = {
  topBar: {
    ar: 'منتجات أصلية 100% · تقسيط ميسر · دعم سريع عبر واتساب',
    en: '100% genuine products · Easy installments · Fast WhatsApp support',
  },

  slides: [
    {
      badge: { ar: 'جديد', en: 'New' },
      brand: 'APPLE',
      title: { ar: 'آيفون 18 برو ماكس', en: 'iPhone 18 Pro Max' },
      subtitle: { ar: 'أحدث وأقوى آيفون', en: 'The newest, most powerful iPhone' },
      prices: [], // مثال: [{ label: { ar: '256 جيجا', en: '256GB' }, old: '600 د.ب', now: '560 د.ب' }]
      note: { ar: 'متاح بالتقسيط', en: 'Available on installments' },
      cta: { ar: 'اشترِ الآن', en: 'Buy now' },
      link: '/p/iphone-18-pro-max',
      image: '', // مثال: '/offers/iphone18.png'
      theme: 'light',
    },
    {
      badge: { ar: 'سامسونج', en: 'Samsung' },
      brand: 'SAMSUNG',
      title: { ar: 'جالكسي إس 26 ألترا', en: 'Galaxy S26 Ultra' },
      subtitle: { ar: 'الذكاء الاصطناعي في إيدك', en: 'AI in your hands' },
      prices: [],
      note: { ar: 'متاح بالتقسيط', en: 'Available on installments' },
      cta: { ar: 'اكتشف المزيد', en: 'Discover more' },
      link: '/p/galaxy-s26-ultra',
      image: '',
      theme: 'navy',
    },
  ],

  // البانر العريض تحت السلايدر
  strip: {
    badge: { ar: 'تقسيط', en: 'Installments' },
    title: { ar: 'قسّط جهازك حتى 12 دفعة', en: 'Pay in up to 12 installments' },
    subtitle: { ar: 'دفعة مقدمة 20% والباقي على أقساط شهرية مريحة', en: '20% down payment, the rest monthly' },
    cta: { ar: 'اشترِ الآن', en: 'Shop now' },
    link: '/c/iphone',
    image: '',
    theme: 'navy',
  },

  savingsDiscounts: {},

  offers: [
    {
      badge: { ar: 'جديد', en: 'New' },
      title: { ar: 'أحدث الآيفون', en: 'Latest iPhones' },
      subtitle: { ar: 'تشكيلة آيفون الجديدة بالتقسيط', en: 'The new iPhone range, on installments' },
      cta: { ar: 'تسوّق الآن', en: 'Shop now' },
      link: '/c/iphone',
      theme: 'red',
    },
    {
      badge: { ar: 'آيباد', en: 'iPad' },
      title: { ar: 'آيباد وأجهزة لوحية', en: 'iPad & tablets' },
      subtitle: { ar: 'للعمل والدراسة والترفيه', en: 'For work, study and fun' },
      cta: { ar: 'اكتشف', en: 'Explore' },
      link: '/c/ipad',
      theme: 'navy',
    },
  ],

  showcases: [
    {
      icon: 'phone',
      title: { ar: 'آيفون بشكل مختلف', en: 'iPhone, reimagined' },
      subtitle: { ar: 'أحدث الأجهزة الأصلية بأفضل الأسعار', en: 'Latest genuine devices at great prices' },
      cta: { ar: 'تسوّق الآيفون', en: 'Shop iPhone' },
      link: '/c/iphone',
      video: '', // مثال: '/videos/iphone.mp4'
      poster: '',
    },
    {
      icon: 'audio',
      title: { ar: 'سماعات وإيربودز', en: 'Headphones & AirPods' },
      subtitle: { ar: 'صوت نقي وتجربة بدون أسلاك', en: 'Pure sound, completely wireless' },
      cta: { ar: 'شوف السماعات', en: 'See headphones' },
      link: '/',
      video: '', // مثال: '/videos/airpods.mp4'
      poster: '',
    },
  ],

  why: {
    title: { ar: 'لماذا كنج فون؟', en: 'Why King Phone?' },
    subtitle: { ar: 'جودة وقيمة وخدمة تثق بها', en: 'Quality, value and service you can trust' },
  },
};
