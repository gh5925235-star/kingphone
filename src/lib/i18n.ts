export type Lang = 'ar' | 'en';

export const LANGS: Lang[] = ['ar', 'en'];
export const DEFAULT_LANG: Lang = 'ar';
const STORAGE_KEY = 'kp_lang';

export function getStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ar' || v === 'en') return v;
  } catch {
    // ignore
  }
  return DEFAULT_LANG;
}

export function storeLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export function applyDir(lang: Lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

// Full bilingual dictionary. Access via t[lang][key].
const dict = {
  ar: {
    // generic
    'brand.name': 'كنج للهواتف',
    'brand.tagline': 'متخصص آيفون في البحرين',
    'nav.home': 'الرئيسية',
    'nav.categories': 'الأقسام',
    'nav.cart': 'السلة',
    'lang.toggle': 'English',
    'loading': 'جارٍ التحميل…',
    'error.generic': 'حدث خطأ. حاول مرة أخرى.',
    'error.noProducts': 'لا توجد منتجات في هذا القسم حالياً.',
    'error.tryAgain': 'حاول مرة أخرى',
    'empty.title': 'لا يوجد شيء هنا بعد',
    'empty.subtitle': 'تصفح منتجاتنا وابدأ التسوق.',
    'cta.shopNow': 'تسوق الآن',
    'cta.browseProducts': 'تصفح المنتجات',
    'cta.viewAll': 'عرض الكل',
    'cta.continueShopping': 'متابعة التسوق',
    'cta.addToCart': 'أضف إلى السلة',
    'cta.buyNow': 'اشترِ الآن',
    'cta.checkout': 'إتمام الشراء',
    'cta.backToCategory': 'العودة للقسم',
    'cta.backHome': 'العودة للرئيسية',

    // home
    'home.heroTitle': 'كنج للهواتف',
    'home.heroSubtitle': 'آيفون وإلكترونيات أصلية في البحرين — أسعار منافسة وتقسيط ميسر',
    'home.installmentsBadge': 'تقسيط متوفر',
    'home.categoriesTitle': 'تسوق حسب القسم',
    'home.categoriesSubtitle': 'اختر جهازك المفضل',
    'home.featuredTitle': 'منتجات مميزة',
    'home.featuredSubtitle': 'الأكثر طلباً هذا الأسبوع',
    'home.trust.genuine': 'منتجات أصلية 100%',
    'home.trust.genuineDesc': 'ضمان رسمي على كل جهاز',
    'home.trust.installments': 'خطوط تقسيط ميسرة',
    'home.trust.installmentsDesc': 'ادفع على دفعات شهرية',
    'home.trust.support': 'دعم سريع عبر واتساب',
    'home.trust.supportDesc': 'نرد عليك خلال دقائق',

    // category
    'cat.searchPlaceholder': 'ابحث عن منتج…',
    'cat.brand': 'العلامة التجارية',
    'cat.allBrands': 'كل العلامات',
    'cat.sort': 'ترتيب',
    'cat.sort.priceLow': 'السعر: من الأقل للأعلى',
    'cat.sort.priceHigh': 'السعر: من الأعلى للأقل',
    'cat.sort.newest': 'الأحدث',
    'cat.productsCount': '{count} منتج',

    // product card
    'card.startingFrom': 'يبدأ من',
    'card.installments': 'تقسيط',
    'card.outOfStock': 'نفد المخزون',

    // product page
    'product.color': 'اللون',
    'product.capacity': 'السعة',
    'product.price': 'السعر',
    'product.quantity': 'الكمية',
    'product.inStock': 'متوفر',
    'product.outOfStock': 'غير متوفر',
    'product.brand': 'العلامة',
    'product.description': 'الوصف',
    'product.related': 'منتجات ذات صلة',
    'product.installmentCalc': 'حاسبة التقسيط',
    'product.months': 'عدد الأشهر',
    'product.downPayment': 'الدفعة المقدمة',
    'product.monthlyAmount': 'القسط الشهري التقديري',
    'product.minDownHint': 'الحد الأدنى للدفعة المقدمة {percent}% من السعر',
    'product.installmentNote': 'شروط التقسيط النهائية يؤكدها المتجر.',
    'product.notSelectedColor': 'اختر اللون',
    'product.notSelectedCapacity': 'اختر السعة',
    'product.selectVariant': 'اختر اللون والسعة لعرض السعر',

    // cart
    'cart.title': 'سلة التسوق',
    'cart.empty': 'سلتك فارغة',
    'cart.emptyDesc': 'أضف منتجات لتبدأ.',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.removeItem': 'حذف',
    'cart.qty': 'الكمية',
    'cart.items': '{count} منتج',
    'cart.clear': 'إفراغ السلة',
    'cart.proceedCheckout': 'متابعة الدفع',
    'cart.added': 'تمت الإضافة إلى السلة',

    // checkout
    'checkout.title': 'إتمام الطلب',
    'checkout.customer': 'بيانات العميل',
    'checkout.name': 'الاسم الكامل',
    'checkout.phone': 'رقم الهاتف',
    'checkout.phoneHint': 'رقم بحريني يبدأ بـ 3',
    'checkout.email': 'البريد الإلكتروني (اختياري)',
    'checkout.cpr': 'الرقم السكاني (CPR)',
    'checkout.cprOptional': 'اختياري',
    'checkout.cprRequired': 'مطلوب للتقسيط',
    'checkout.address': 'عنوان التوصيل',
    'checkout.notes': 'ملاحظات (اختياري)',
    'checkout.paymentType': 'طريقة الدفع',
    'checkout.fullPayment': 'دفع كامل',
    'checkout.installment': 'تقسيط',
    'checkout.months': 'عدد الأشهر',
    'checkout.downPayment': 'الدفعة المقدمة',
    'checkout.monthly': 'القسط الشهري',
    'checkout.summary': 'ملخص الطلب',
    'checkout.total': 'الإجمالي',
    'checkout.submit': 'تأكيد الطلب',
    'checkout.submitting': 'جارٍ تأكيد الطلب…',
    'checkout.cartEmpty': 'سلتك فارغة. أضف منتجات أولاً.',
    'checkout.required': 'هذا الحقل مطلوب',
    'checkout.phoneInvalid': 'رقم هاتف غير صحيح',
    'checkout.cprRequiredMsg': 'الرقم السكاني مطلوب للتقسيط',
    'checkout.downPaymentLow': 'الدفعة المقدمة يجب أن تكون {min} على الأقل',
    'checkout.success': 'تم استلام طلبك بنجاح!',

    // confirmation
    'confirm.title': 'تم تأكيد طلبك',
    'confirm.orderNumber': 'رقم الطلب',
    'confirm.summary': 'ملخص الطلب',
    'confirm.payBenefit': 'ادفع عبر Benefit',
    'confirm.payBenefitInstallment': 'ادفع الدفعة المقدمة عبر Benefit',
    'confirm.completeWhatsapp': 'أكمل الطلب عبر واتساب',
    'confirm.note': 'سنتواصل معك قريباً لتأكيد طلبك.',
    'confirm.notFound': 'تعذر العثور على بيانات الطلب.',
    'confirm.thanks': 'شكراً لثقتك بكنج للهواتف',

    // footer
    'footer.about': 'كنج للهواتف — متخصص في أجهزة آيفون والإلكترونيات في البحرين. منتجات أصلية وتقسيط ميسر.',
    'footer.contact': 'تواصل معنا',
    'footer.address': 'العنوان',
    'footer.hours': 'ساعات العمل',
    'footer.rights': '© King Phone',
    'footer.quickLinks': 'روابط سريعة',

    // admin
    'admin.title': 'لوحة الإدارة',
    'admin.comingSoon': 'قريباً — لوحة الإدارة قيد التطوير',

    // whatsapp float
    'whatsapp.contact': 'تواصل معنا على واتساب',
  },
  en: {
    'brand.name': 'King Phone',
    'brand.tagline': 'iPhone Specialist, Bahrain',
    'nav.home': 'Home',
    'nav.categories': 'Categories',
    'nav.cart': 'Cart',
    'lang.toggle': 'العربية',
    'loading': 'Loading…',
    'error.generic': 'Something went wrong. Try again.',
    'error.noProducts': 'No products in this category yet.',
    'error.tryAgain': 'Try again',
    'empty.title': 'Nothing here yet',
    'empty.subtitle': 'Browse our products and start shopping.',
    'cta.shopNow': 'Shop now',
    'cta.browseProducts': 'Browse products',
    'cta.viewAll': 'View all',
    'cta.addToCart': 'Add to cart',
    'cta.buyNow': 'Buy now',
    'cta.checkout': 'Checkout',
    'cta.backToCategory': 'Back to category',
    'cta.backHome': 'Back to home',

    'home.heroTitle': 'King Phone',
    'home.heroSubtitle': 'Genuine iPhone & electronics in Bahrain — competitive prices and easy installments',
    'home.installmentsBadge': 'Installments available',
    'home.categoriesTitle': 'Shop by category',
    'home.categoriesSubtitle': 'Pick your favorite device',
    'home.featuredTitle': 'Featured products',
    'home.featuredSubtitle': 'Most popular this week',
    'home.trust.genuine': '100% Genuine',
    'home.trust.genuineDesc': 'Official warranty on every device',
    'home.trust.installments': 'Easy installments',
    'home.trust.installmentsDesc': 'Pay in monthly installments',
    'home.trust.support': 'Fast WhatsApp support',
    'home.trust.supportDesc': 'We reply within minutes',

    'cat.searchPlaceholder': 'Search products…',
    'cat.brand': 'Brand',
    'cat.allBrands': 'All brands',
    'cat.sort': 'Sort',
    'cat.sort.priceLow': 'Price: low to high',
    'cat.sort.priceHigh': 'Price: high to low',
    'cat.sort.newest': 'Newest',
    'cat.productsCount': '{count} products',

    'card.startingFrom': 'Starting from',
    'card.installments': 'Installments',
    'card.outOfStock': 'Out of stock',

    'product.color': 'Color',
    'product.capacity': 'Capacity',
    'product.price': 'Price',
    'product.quantity': 'Quantity',
    'product.inStock': 'In stock',
    'product.outOfStock': 'Out of stock',
    'product.brand': 'Brand',
    'product.description': 'Description',
    'product.related': 'Related products',
    'product.installmentCalc': 'Installment calculator',
    'product.months': 'Months',
    'product.downPayment': 'Down payment',
    'product.monthlyAmount': 'Estimated monthly amount',
    'product.minDownHint': 'Minimum down payment is {percent}% of the price',
    'product.installmentNote': 'Final installment terms are confirmed by the shop.',
    'product.notSelectedColor': 'Select a color',
    'product.notSelectedCapacity': 'Select a capacity',
    'product.selectVariant': 'Select color and capacity to see the price',

    'cart.title': 'Your cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDesc': 'Add products to get started.',
    'cart.subtotal': 'Subtotal',
    'cart.removeItem': 'Remove',
    'cart.qty': 'Qty',
    'cart.items': '{count} items',
    'cart.clear': 'Clear cart',
    'cart.proceedCheckout': 'Proceed to checkout',
    'cart.added': 'Added to cart',

    'checkout.title': 'Checkout',
    'checkout.customer': 'Customer details',
    'checkout.name': 'Full name',
    'checkout.phone': 'Phone number',
    'checkout.phoneHint': 'Bahraini number starting with 3',
    'checkout.email': 'Email (optional)',
    'checkout.cpr': 'CPR number',
    'checkout.cprOptional': 'optional',
    'checkout.cprRequired': 'required for installments',
    'checkout.address': 'Delivery address',
    'checkout.notes': 'Notes (optional)',
    'checkout.paymentType': 'Payment type',
    'checkout.fullPayment': 'Full payment',
    'checkout.installment': 'Installment',
    'checkout.months': 'Months',
    'checkout.downPayment': 'Down payment',
    'checkout.monthly': 'Monthly amount',
    'checkout.summary': 'Order summary',
    'checkout.total': 'Total',
    'checkout.submit': 'Place order',
    'checkout.submitting': 'Placing order…',
    'checkout.cartEmpty': 'Your cart is empty. Add products first.',
    'checkout.required': 'This field is required',
    'checkout.phoneInvalid': 'Invalid phone number',
    'checkout.cprRequiredMsg': 'CPR is required for installments',
    'checkout.downPaymentLow': 'Down payment must be at least {min}',
    'checkout.success': 'Your order was placed successfully!',

    'confirm.title': 'Order confirmed',
    'confirm.orderNumber': 'Order number',
    'confirm.summary': 'Order summary',
    'confirm.payBenefit': 'Pay full amount via Benefit',
    'confirm.payBenefitInstallment': 'Pay the down payment via Benefit',
    'confirm.completeWhatsapp': 'Complete the order on WhatsApp',
    'confirm.note': 'We will contact you shortly to confirm your order.',
    'confirm.notFound': 'Could not find your order data.',
    'confirm.thanks': 'Thank you for shopping with King Phone',

    'footer.about': 'King Phone — iPhone and electronics specialist in Bahrain. Genuine products and easy installments.',
    'footer.contact': 'Contact',
    'footer.address': 'Address',
    'footer.hours': 'Working hours',
    'footer.rights': '© King Phone',
    'footer.quickLinks': 'Quick links',

    'admin.title': 'Admin panel',
    'admin.comingSoon': 'Coming soon — admin panel under development',

    'whatsapp.contact': 'Chat with us on WhatsApp',
  },
} as const;

export type DictKey = keyof typeof dict['ar'];

// Cast the per-language dictionaries to a uniform indexable record so that
// dict[lang][key] type-checks cleanly regardless of which language is active.
const dictAr: Record<DictKey, string> = dict.ar as unknown as Record<DictKey, string>;
const dictEn: Record<DictKey, string> = dict.en as unknown as Record<DictKey, string>;
const dictByLang: Record<Lang, Record<DictKey, string>> = { ar: dictAr, en: dictEn };

export function tr(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  let s: string = dictByLang[lang][key] ?? dictAr[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

export function pickName(
  lang: Lang,
  ar: string | null | undefined,
  en: string | null | undefined,
): string {
  if (lang === 'ar') return ar || en || '';
  return en || ar || '';
}
