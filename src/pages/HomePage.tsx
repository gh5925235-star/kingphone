import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gamepad2,
  Headphones,
  Laptop,
  MessageCircle,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Watch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { pickName, type Lang } from '@/lib/i18n';
import { useSeo } from '@/components/Seo';
import { ProductCard, MIN_DOWN_PERCENT, MAX_MONTHS } from '@/components/ProductCard';
import { ErrorState } from '@/components/States';
import { HOME_CONTENT, type L, type Offer, type OfferTheme, type Showcase, type Slide } from '@/config/homeContent';

// أيقونة القسم حسب اسم الـ slug
function iconForCategory(slug: string): LucideIcon {
  const s = slug.toLowerCase();
  if (s.includes('play') || s.includes('game')) return Gamepad2;
  if (s.includes('ipad') || s.includes('tab')) return Tablet;
  if (s.includes('air') || s.includes('audio') || s.includes('head') || s.includes('sound')) return Headphones;
  if (s.includes('watch')) return Watch;
  if (s.includes('mac') || s.includes('laptop') || s.includes('book')) return Laptop;
  return Smartphone;
}

const SHOWCASE_ICONS: Record<Showcase['icon'], LucideIcon> = {
  phone: Smartphone,
  audio: Headphones,
  watch: Watch,
  laptop: Laptop,
};

// ألوان مربعات الأقسام (pastel زي جرير): خلفية + لون النص
const TILE_COLORS = [
  'bg-orange-100 text-orange-800',
  'bg-amber-100 text-amber-800',
  'bg-slate-200 text-slate-800',
  'bg-rose-100 text-rose-800',
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
];

// ألوان الكروت (النص الفاتح = text-ink-950 لأن ink معكوس في الثيم)
const THEMES: Record<OfferTheme, { box: string; text: string; accent: string }> = {
  light: {
    box: 'bg-gradient-to-br from-tint-50 to-tint-100 border border-white/5',
    text: 'text-white',
    accent: 'text-gold-300',
  },
  red: {
    box: 'bg-gradient-to-br from-gold-300 to-gold-500',
    text: 'text-ink-950',
    accent: 'text-ink-950',
  },
  navy: {
    box: 'bg-gradient-to-br from-slate-900 to-slate-700',
    text: 'text-ink-950',
    accent: 'text-ink-950',
  },
  orange: {
    box: 'bg-gradient-to-br from-orange-500 to-amber-500',
    text: 'text-ink-950',
    accent: 'text-ink-950',
  },
};

export function HomePage() {
  const { lang, t, dir } = useLang();
  const { settings } = useSettings();
  const isAr = lang === 'ar';
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useSeo({
    title: undefined,
    description:
      lang === 'ar'
        ? 'كنج للهواتف — متخصص آيفون والإلكترونيات في البحرين. منتجات أصلية، تقسيط ميسر، ودعم سريع عبر واتساب.'
        : 'King Phone — iPhone and electronics specialist in Bahrain. Genuine products, easy installments, fast WhatsApp support.',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      const [catRes, featRes, latestRes, brandRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('products').select('brand').eq('is_active', true),
      ]);
      if (!active) return;
      if (catRes.error || featRes.error) {
        setError(true);
      } else {
        setCategories(catRes.data as Category[]);
        setFeatured(featRes.data as Product[]);
      }
      if (!latestRes.error && latestRes.data) setLatest(latestRes.data as Product[]);
      if (!brandRes.error && brandRes.data) {
        const uniq = Array.from(
          new Set((brandRes.data as { brand: string | null }[]).map((r) => (r.brand ?? '').trim()).filter(Boolean)),
        );
        setBrands(uniq.slice(0, 10));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const pick = (v: L) => (isAr ? v.ar : v.en);
  const waNumber = settings?.whatsappNumber?.replace(/\D/g, '') ?? '';

  const whyItems = [
    { icon: BadgeCheck, title: t('home.trust.genuine'), desc: t('home.trust.genuineDesc') },
    { icon: CreditCard, title: t('home.trust.installments'), desc: t('home.trust.installmentsDesc') },
    { icon: MessageCircle, title: t('home.trust.support'), desc: t('home.trust.supportDesc') },
  ];

  const steps = [
    {
      n: 1,
      title: isAr ? 'اختار جهازك' : 'Pick your device',
      desc: isAr ? 'تصفّح المنتجات واختار اللون والسعة' : 'Browse and choose the color and storage',
    },
    {
      n: 2,
      title: isAr ? `ادفع ${Math.round(MIN_DOWN_PERCENT * 100)}% مقدّم` : `Pay ${Math.round(MIN_DOWN_PERCENT * 100)}% down`,
      desc: isAr ? 'دفعة مقدمة صغيرة وتستلم جهازك' : 'A small down payment and the device is yours',
    },
    {
      n: 3,
      title: isAr ? `قسّط الباقي حتى ${MAX_MONTHS} شهر` : `Pay the rest over ${MAX_MONTHS} months`,
      desc: isAr ? 'اختار 3 أو 6 أو 9 أو 12 شهر' : 'Choose 3, 6, 9 or 12 months',
    },
  ];

  return (
    <div>
      {/* الشريط العلوي */}
      <div className="bg-gold-gradient px-4 py-2 text-center text-xs font-semibold text-ink-950 sm:text-sm">
        {pick(HOME_CONTENT.topBar)}
      </div>

      {/* الأقسام (فوق) */}
      <section className="container-page pt-4">
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 w-28 shrink-0 animate-pulse rounded-2xl bg-tint-200" />
              ))
            : categories.map((c, i) => {
                const Icon = iconForCategory(c.slug);
                const name = pickName(lang, c.name_ar, c.name_en);
                return (
                  <Link
                    key={c.id}
                    to={`/c/${c.slug}`}
                    className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center shadow-card transition-transform duration-300 hover:-translate-y-1 sm:w-32 ${TILE_COLORS[i % TILE_COLORS.length]}`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900">
                      <Icon size={22} />
                    </span>
                    <span className="text-[11px] font-bold leading-snug">{name}</span>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* بانر متحرك */}
      <section className="container-page mt-4">
        <HeroCarousel
          slides={HOME_CONTENT.slides}
          dir={dir}
          pick={pick}
          brand={
            <div className="grid grid-cols-5 items-center gap-3 p-5 sm:p-10">
              <div className="col-span-3 flex flex-col gap-3">
                <span className="badge-gold w-fit">{t('home.installmentsBadge')}</span>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
                  <span className="text-gold-gradient">{t('home.heroTitle')}</span>
                </h1>
                <p className="text-sm text-white/70 sm:text-lg">{t('home.heroSubtitle')}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link to="/c/iphone" className="btn-gold">
                    {t('cta.shopNow')} <Arrow size={18} />
                  </Link>
                </div>
              </div>
              <div className="col-span-2 flex justify-center">
                <div className="h-32 w-32 animate-float overflow-hidden rounded-full bg-ink-900 shadow-card sm:h-64 sm:w-64">
                  <img src="/logo.png?v=2" alt="King Phone" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          }
        />
      </section>

      {/* بانر عريض */}
      <section className="container-page mt-4">
        <StripBanner strip={HOME_CONTENT.strip} pick={pick} Icon={NextIcon} />
      </section>

      {/* الماركات */}
      {brands.length > 0 && (
        <section className="container-page mt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-2xl border border-white/5 bg-ink-900 px-6 py-4 shadow-card">
            {brands.map((b) => (
              <span key={b} className="text-lg font-extrabold uppercase tracking-wide text-white/35">
                {b}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* اكتشف أفضل اختياراتنا */}
      <section className="container-page mt-10">
        <SectionHeader
          title={isAr ? 'اكتشف أفضل اختياراتنا' : 'Discover our best picks'}
          subtitle={isAr ? 'المنتجات الرائجة والأفضل' : 'Trending and top products'}
        />
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            { href: '#latest', icon: Sparkles, label: isAr ? 'وصل حديثاً' : 'New arrivals', color: 'bg-sky-100 text-sky-800 border-sky-200' },
            { href: '#featured', icon: Star, label: isAr ? 'منتجات مميزة' : 'Featured', color: 'bg-amber-100 text-amber-800 border-amber-200' },
            { href: '#installments', icon: CreditCard, label: isAr ? 'التقسيط' : 'Installments', color: 'bg-violet-100 text-violet-800 border-violet-200' },
            ...(waNumber
              ? [{ href: `https://wa.me/${waNumber}`, icon: MessageCircle, label: isAr ? 'واتساب' : 'WhatsApp', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }]
              : []),
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-full border-2 text-center text-xs font-bold shadow-card transition-transform hover:-translate-y-1 ${s.color}`}
            >
              <s.icon size={30} />
              {s.label}
            </a>
          ))}
        </div>
      </section>

      {/* أفضل فئات التوفير (كروت الخصومات) */}
      {categories.length > 0 && (
        <section className="container-page mt-10">
          <SectionHeader
            title={isAr ? 'أفضل فئات التوفير' : 'Best savings categories'}
            subtitle={isAr ? 'اكتشف العروض في جميع الفئات' : 'Discover deals across all categories'}
          />
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((c) => {
              const Icon = iconForCategory(c.slug);
              const discount = HOME_CONTENT.savingsDiscounts[c.slug];
              return (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="group flex w-40 shrink-0 flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-tint-100 to-tint-50 p-3 text-center shadow-card transition-transform hover:-translate-y-1"
                >
                  <span className="text-xs font-bold text-white">{pickName(lang, c.name_ar, c.name_en)}</span>
                  <span className="flex h-24 w-full items-center justify-center text-gold-300 transition-transform group-hover:scale-110">
                    <Icon size={56} strokeWidth={1.4} />
                  </span>
                  {discount ? (
                    <span className="text-lg font-extrabold text-gold-300">{pick(discount)}</span>
                  ) : (
                    <span className="text-xs font-bold text-gold-300">{isAr ? 'اكتشف العروض' : 'See deals'}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* كروت العروض */}
      <section className="container-page mt-10 grid gap-4 md:grid-cols-2">
        {HOME_CONTENT.offers.map((o: Offer, i: number) => (
          <OfferCard key={i} offer={o} pick={pick} Icon={NextIcon} />
        ))}
      </section>

      {/* منتجات مميزة */}
      <section id="featured" className="container-page mt-12 scroll-mt-24">
        <SectionHeader
          title={t('home.featuredTitle')}
          subtitle={t('home.featuredSubtitle')}
          action={
            <Link
              to="/c/iphone"
              className="flex items-center gap-1 text-sm font-semibold text-gold-200 hover:text-gold-300"
            >
              {t('cta.viewAll')} <NextIcon size={16} />
            </Link>
          }
        />
        {error ? (
          <ErrorState />
        ) : loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 w-44 shrink-0 animate-pulse rounded-2xl bg-tint-200 sm:w-56" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="py-10 text-center text-white/50">{t('error.noProducts')}</p>
        ) : (
          <ProductRow items={featured} lang={lang} />
        )}
      </section>

      {/* أماكن الفيديو */}
      <section className="container-page mt-12">
        <SectionHeader
          title={isAr ? 'شاهد وتعرّف' : 'Watch & explore'}
          subtitle={isAr ? 'أحدث الأجهزة بشكل مختلف' : 'Our latest devices, up close'}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_CONTENT.showcases.map((s: Showcase, i: number) => {
            const Icon = SHOWCASE_ICONS[s.icon];
            return (
              <Link
                key={i}
                to={s.link}
                className="group relative block aspect-[16/10] overflow-hidden rounded-3xl bg-slate-900 shadow-card"
              >
                {s.video ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={s.poster || undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                  >
                    <source src={s.video} type="video/mp4" />
                  </video>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-gold-600">
                    <Icon size={150} className="animate-float text-ink-950/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-ink-950 sm:p-6">
                  <h3 className="text-xl font-extrabold sm:text-2xl">{pick(s.title)}</h3>
                  <p className="mt-1 text-sm opacity-85">{pick(s.subtitle)}</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-ink-900 px-4 py-2 text-xs font-bold text-white">
                    {pick(s.cta)} <NextIcon size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* وصل حديثاً */}
      {latest.length > 0 && (
        <section id="latest" className="container-page mt-12 scroll-mt-24">
          <SectionHeader
            title={isAr ? 'وصل حديثاً' : 'New arrivals'}
            subtitle={isAr ? 'آخر المنتجات المضافة للمتجر' : 'The latest products in our store'}
          />
          <ProductRow items={latest} lang={lang} />
        </section>
      )}

      {/* لماذا كنج فون */}
      <section className="mt-12 bg-tint-50 py-10">
        <div className="container-page">
          <SectionHeader title={pick(HOME_CONTENT.why.title)} subtitle={pick(HOME_CONTENT.why.subtitle)} />
          <div className="grid gap-4 sm:grid-cols-3">
            {whyItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center gap-3 rounded-2xl bg-ink-900 p-8 text-center shadow-card"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-300/10 text-gold-300">
                  <item.icon size={32} />
                </span>
                <p className="text-lg font-bold text-white">{item.title}</p>
                <p className="text-sm text-white/55">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* التقسيط */}
      <section id="installments" className="container-page mt-12 scroll-mt-24">
        <SectionHeader
          title={isAr ? 'التقسيط' : 'Installments'}
          subtitle={isAr ? 'خيارات دفع مرنة' : 'Flexible payment options'}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex items-center gap-4 rounded-2xl bg-tint-100 p-6 shadow-card">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-2xl font-extrabold text-ink-950">
                {s.n}
              </span>
              <div>
                <p className="font-bold text-white">{s.title}</p>
                <p className="text-sm text-white/60">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* واتساب */}
      {waNumber && (
        <section className="container-page mt-12">
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-ink-950 shadow-card sm:flex-row sm:p-8">
            <div className="text-center sm:text-start">
              <h3 className="text-xl font-extrabold sm:text-2xl">
                {isAr ? 'عندك سؤال؟ كلّمنا على واتساب' : 'Have a question? Chat on WhatsApp'}
              </h3>
              <p className="mt-1 text-sm opacity-90">
                {isAr ? 'بنرد عليك في أسرع وقت ونساعدك تختار' : 'We reply fast and help you choose'}
              </p>
            </div>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white shadow-card transition-transform hover:scale-105"
            >
              <MessageCircle size={18} />
              {isAr ? 'ابدأ المحادثة' : 'Start chat'}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------------------- مكونات مساعدة ---------------------------- */

function ProductRow({ items, lang }: { items: Product[]; lang: Lang }) {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-3 no-scrollbar">
      {items.map((p) => (
        <div key={p.id} className="w-44 shrink-0 snap-start sm:w-56">
          <ProductCard product={p} lang={lang} />
        </div>
      ))}
    </div>
  );
}

function HeroCarousel({
  slides,
  brand,
  dir,
  pick,
}: {
  slides: Slide[];
  brand: React.ReactNode;
  dir: 'rtl' | 'ltr';
  pick: (v: L) => string;
}) {
  const total = slides.length + 1; // +1 لشريحة اللوجو
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (step: number) => setIndex((i) => (i + step + total) % total);

  useEffect(() => {
    if (paused || total < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [paused, total]);

  const sign = dir === 'rtl' ? 1 : -1;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        setPaused(false);
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 40) return;
        const forward = dir === 'rtl' ? dx > 0 : dx < 0;
        go(forward ? 1 : -1);
      }}
    >
      <div className="overflow-hidden rounded-3xl shadow-card">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${sign * index * 100}%)` }}
        >
          <div className="w-full shrink-0 bg-gradient-to-br from-tint-100 via-tint-50 to-ink-900">{brand}</div>
          {slides.map((s, i) => {
            const th = THEMES[s.theme];
            return (
              <Link
                key={i}
                to={s.link}
                className={`relative block w-full shrink-0 overflow-hidden ${th.box} ${th.text}`}
              >
                <div className="grid min-h-[17rem] grid-cols-5 items-center gap-3 p-5 sm:min-h-[22rem] sm:p-10">
                  <div className="col-span-3 flex flex-col gap-2">
                    {s.badge && (
                      <span className="w-fit rounded-md bg-amber-300 px-3 py-1 text-[11px] font-bold text-slate-900">
                        {pick(s.badge)}
                      </span>
                    )}
                    {s.brand && <span className="text-xl font-black tracking-widest sm:text-3xl">{s.brand}</span>}
                    <h3 className="text-2xl font-extrabold leading-snug sm:text-4xl">{pick(s.title)}</h3>
                    {s.subtitle && <p className="text-sm opacity-80 sm:text-base">{pick(s.subtitle)}</p>}
                    {s.prices && s.prices.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                        {s.prices.map((p, k) => (
                          <div key={k}>
                            {p.label && <p className="text-[11px] opacity-70">{pick(p.label)}</p>}
                            {p.old && <p className="text-xs line-through opacity-60">{p.old}</p>}
                            <p className={`text-2xl font-extrabold sm:text-3xl ${th.accent}`}>{p.now}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {s.note && <p className="text-[11px] opacity-70">{pick(s.note)}</p>}
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-ink-900 px-5 py-2 text-xs font-bold text-white shadow-card">
                      {pick(s.cta)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    {s.image ? (
                      <img src={s.image} alt="" className="max-h-56 w-auto object-contain sm:max-h-80" />
                    ) : (
                      <Smartphone size={110} strokeWidth={1.2} className="animate-float opacity-30" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-gold-300' : 'w-2 bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

function StripBanner({
  strip,
  pick,
  Icon,
}: {
  strip: (typeof HOME_CONTENT)['strip'];
  pick: (v: L) => string;
  Icon: LucideIcon;
}) {
  const th = THEMES[strip.theme];
  return (
    <Link
      to={strip.link}
      className={`relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl p-6 shadow-card transition-transform hover:-translate-y-0.5 sm:p-8 ${th.box} ${th.text}`}
    >
      <div className="relative">
        {strip.badge && (
          <span className="inline-block rounded-full bg-ink-900/20 px-3 py-1 text-[11px] font-bold">{pick(strip.badge)}</span>
        )}
        <h3 className="mt-2 text-2xl font-extrabold sm:text-4xl">{pick(strip.title)}</h3>
        <p className="mt-1 text-sm opacity-85 sm:text-base">{pick(strip.subtitle)}</p>
        <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-ink-900 px-5 py-2 text-xs font-bold text-white">
          {pick(strip.cta)} <Icon size={14} />
        </span>
      </div>
      {strip.image && <img src={strip.image} alt="" className="relative h-28 w-auto object-contain sm:h-40" />}
    </Link>
  );
}

function OfferCard({
  offer: o,
  pick,
  Icon,
}: {
  offer: Offer;
  pick: (v: L) => string;
  Icon: LucideIcon;
}) {
  const th = THEMES[o.theme];
  return (
    <Link
      to={o.link}
      className={`group relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-card transition-transform duration-300 hover:-translate-y-1 ${th.box} ${th.text}`}
    >
      <span className="pointer-events-none absolute -bottom-12 -end-12 h-44 w-44 rounded-full bg-ink-900/10" />
      {o.image && (
        <img
          src={o.image}
          alt=""
          className="pointer-events-none absolute bottom-0 end-3 h-36 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className={`relative ${o.image ? 'pe-28 sm:pe-32' : ''}`}>
        <span className="inline-block rounded-full bg-ink-900/20 px-3 py-1 text-[11px] font-bold">{pick(o.badge)}</span>
        <h3 className="mt-3 text-2xl font-extrabold leading-snug">{pick(o.title)}</h3>
        <p className="mt-1 text-sm opacity-85">{pick(o.subtitle)}</p>
      </div>
      <span className="relative mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-ink-900 px-4 py-2 text-xs font-bold text-white">
        {pick(o.cta)} <Icon size={14} />
      </span>
    </Link>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="h-8 w-1.5 rounded-full bg-gold-gradient" />
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-white/50">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
