// ===========================================================================
//  محتوى الصفحة الرئيسية — الملف ده هو اللي بتعدّل فيه العروض والفيديوهات
//  كل نص له نسختين: ar (عربي) و en (إنجليزي)
// ===========================================================================

export type L = { ar: string; en: string };

// لون الكارت: red = أحمر | navy = كحلي | orange = برتقالي | light = فاتح
export type OfferTheme = 'red' | 'navy' | 'orange' | 'light';

export type Offer = {
  badge: L; // الشارة الصغيرة فوق (مثلاً: جديد، عرض)
  title: L; // العنوان الكبير
  subtitle: L; // سطر توضيحي
  cta: L; // نص الزرار
  link: string; // الصفحة اللي يفتحها الكارت، مثلاً /c/iphone
  image?: string; // اختياري: صورة PNG شفافة، حطها في public/offers/ واكتب /offers/اسم.png
  theme: OfferTheme;
};

// icon: phone | audio | watch | laptop (أيقونة تظهر لو مفيش فيديو)
export type Showcase = {
  icon: 'phone' | 'audio' | 'watch' | 'laptop';
  title: L;
  subtitle: L;
  cta: L;
  link: string;
  video?: string; // اختياري: حط ملف mp4 في public/videos/ واكتب /videos/اسم.mp4
  poster?: string; // اختياري: صورة تظهر قبل ما الفيديو يشتغل (/videos/اسم.jpg)
};

export const HOME_CONTENT: {
  topBar: L;
  offers: Offer[];
  showcases: Showcase[];
} = {
  // الشريط الأحمر الرفيع فوق الصفحة
  topBar: {
    ar: 'منتجات أصلية 100% · تقسيط ميسر · دعم سريع عبر واتساب',
    en: '100% genuine products · Easy installments · Fast WhatsApp support',
  },

  // كروت العروض (3 كروت). تقدر تزود أو تشيل كارت، والأحسن تفضل 3.
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
    {
      badge: { ar: 'تقسيط', en: 'Installments' },
      title: { ar: 'قسّط جهازك بسهولة', en: 'Pay in easy installments' },
      subtitle: { ar: 'دفعة مقدمة صغيرة والباقي على شهور', en: 'Small down payment, the rest monthly' },
      cta: { ar: 'ابدأ الآن', en: 'Start now' },
      link: '/c/iphone',
      theme: 'orange',
    },
  ],

  // مكانين للفيديو (آيفون + سماعات). لو مفيش فيديو بيظهر تصميم متحرك بالأيقونة.
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
};
