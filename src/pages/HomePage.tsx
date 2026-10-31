import { useEffect, useState } from 'react';
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
  Tablet,
  Watch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';
import { useSeo } from '@/components/Seo';
import { ProductCard, MIN_DOWN_PERCENT, MAX_MONTHS } from '@/components/ProductCard';
import { SkeletonGrid, ErrorState } from '@/components/States';
import { HOME_CONTENT, type Offer, type OfferTheme, type Showcase } from '@/config/homeContent';

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

// ألوان فاتحة للمربعات (زي أقسام جرير)
const TILE_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-slate-200 text-slate-700',
];

// ألوان كروت العروض (النص الفاتح = text-ink-950 لأن ink معكوس في الثيم)
const OFFER_THEMES: Record<OfferTheme, string> = {
  red: 'bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950',
  navy: 'bg-gradient-to-br from-slate-900 to-slate-700 text-ink-950',
  orange: 'bg-gradient-to-br from-orange-500 to-amber-500 text-ink-950',
  light: 'bg-gradient-to-br from-tint-100 to-tint-200 text-white border border-white/5',
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
          .limit(8),
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
  const pick = (v: { ar: string; en: string }) => (isAr ? v.ar : v.en);
  const waNumber = settings?.whatsappNumber?.replace(/\D/g, '') ?? '';

  const trustItems = [
    { icon: BadgeCheck, title: t('home.trust.genuine'), desc: t('home.trust.genuineDesc') },
    { icon: CreditCard, title: t('home.trust.installments'), desc: t('home.trust.installmentsDesc') },
    { icon: MessageCircle, title: t('home.trust.support'), desc: t('home.trust.supportDesc') },
  ];

  return (
    <div>
      {/* الشريط العلوي */}
      <div className="bg-gold-gradient px-4 py-2 text-center text-xs font-semibold text-ink-950 sm:text-sm">
        {pick(HOME_CONTENT.topBar)}
      </div>

      {/* بانر رئيسي */}
      <section className="container-page pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-tint-100 via-tint-50 to-ink-900 shadow-card">
          <div className="absolute -end-20 -top-20 h-72 w-72 rounded-full bg-gold-300/10 blur-3xl" />
          <div className="relative grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
            <div className="flex flex-col gap-5 animate-fade-in">
              <span className="badge-gold w-fit">{t('home.installmentsBadge')}</span>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                <span className="text-gold-gradient">{t('home.heroTitle')}</span>
              </h1>
              <p className="max-w-xl text-base text-white/70 sm:text-lg">{t('home.heroSubtitle')}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/c/iphone" className="btn-gold">
                  {t('cta.shopNow')} <Arrow size={18} />
                </Link>
                <Link to="/c/iphone" className="btn-ghost">
                  {t('cta.browseProducts')}
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="h-56 w-56 animate-float overflow-hidden rounded-full bg-ink-900 shadow-card sm:h-72 sm:w-72 lg:h-96 lg:w-96">
                <img src="/logo.png?v=2" alt="King Phone" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* كروت العروض */}
      <section className="container-page mt-6 grid gap-4 md:grid-cols-3">
        {HOME_CONTENT.offers.map((o: Offer, i: number) => (
          <Link
            key={i}
            to={o.link}
            className={`group relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-card transition-transform duration-300 hover:-translate-y-1 ${OFFER_THEMES[o.theme]}`}
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
              <span className="inline-block rounded-full bg-ink-900/20 px-3 py-1 text-[11px] font-bold">
                {pick(o.badge)}
              </span>
              <h3 className="mt-3 text-2xl font-extrabold leading-snug">{pick(o.title)}</h3>
              <p className="mt-1 text-sm opacity-85">{pick(o.subtitle)}</p>
            </div>
            <span className="relative mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-ink-900 px-4 py-2 text-xs font-bold text-white">
              {pick(o.cta)} <NextIcon size={14} />
            </span>
          </Link>
        ))}
      </section>

      {/* بانرات التقسيط */}
      <section className="container-page mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-5 bg-tint-100 p-6">
          <span className="text-6xl font-extrabold leading-none text-gold-300">{MAX_MONTHS}</span>
          <div>
            <p className="text-lg font-bold text-white">{isAr ? 'شهر تقسيط' : 'months installments'}</p>
            <p className="text-sm text-white/60">
              {isAr ? 'اختار المدة اللي تناسبك: 3 · 6 · 9 · 12' : 'Pick your plan: 3 · 6 · 9 · 12'}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-5 bg-tint-100 p-6">
          <span className="text-6xl font-extrabold leading-none text-gold-300">
            {Math.round(MIN_DOWN_PERCENT * 100)}%
          </span>
          <div>
            <p className="text-lg font-bold text-white">{isAr ? 'دفعة مقدمة فقط' : 'down payment only'}</p>
            <p className="text-sm text-white/60">
              {isAr ? 'والباقي على أقساط شهرية مريحة' : 'and the rest in easy monthly payments'}
            </p>
          </div>
        </div>
      </section>

      {/* الأقسام */}
      <section className="container-page mt-12">
        <SectionHeader title={t('home.categoriesTitle')} subtitle={t('home.categoriesSubtitle')} />
        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
            {categories.map((c, i) => {
              const Icon = iconForCategory(c.slug);
              const name = pickName(lang, c.name_ar, c.name_en);
              return (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="group flex w-28 shrink-0 flex-col items-center gap-3 sm:w-auto"
                >
                  <span
                    className={`flex h-24 w-24 items-center justify-center rounded-2xl shadow-card transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-28 sm:w-full ${TILE_COLORS[i % TILE_COLORS.length]}`}
                  >
                    <Icon size={38} />
                  </span>
                  <span className="text-center text-xs font-semibold leading-snug text-white">{name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* أماكن الفيديو */}
      <section className="container-page mt-12">
        <SectionHeader
          title={isAr ? 'اكتشف أحدث الأجهزة' : 'Discover the latest'}
          subtitle={isAr ? 'شاهد وتعرّف على أفضل المنتجات' : 'Watch and explore our best products'}
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

      {/* منتجات مميزة */}
      <section className="container-page mt-12">
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
        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState />
        ) : featured.length === 0 ? (
          <p className="py-10 text-center text-white/50">{t('error.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        )}
      </section>

      {/* وصل حديثاً */}
      {latest.length > 0 && (
        <section className="container-page mt-12">
          <SectionHeader
            title={isAr ? 'وصل حديثاً' : 'New arrivals'}
            subtitle={isAr ? 'آخر المنتجات المضافة للمتجر' : 'The latest products in our store'}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* شريط الماركات */}
      {brands.length > 0 && (
        <section className="container-page mt-12">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-2xl border border-white/5 bg-ink-900 px-6 py-5 shadow-card">
            {brands.map((b) => (
              <span key={b} className="text-lg font-extrabold uppercase tracking-wide text-white/35">
                {b}
              </span>
            ))}
          </div>
        </section>
      )}

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

      {/* ليه كنج فون */}
      <section className="container-page mt-12 grid gap-4 sm:grid-cols-3">
        {trustItems.map((item) => (
          <div
            key={item.title}
            className="card flex items-center gap-4 p-5 transition-all duration-300 hover:border-gold-300/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-300/10 text-gold-300">
              <item.icon size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-white/50">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
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
    <div className="mb-6 flex items-end justify-between gap-4">
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
