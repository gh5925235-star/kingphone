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
import { supabase, type Category, type Product } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';
import { useSeo } from '@/components/Seo';
import { ProductCard, ProductImage, monthlyInstallment, MIN_DOWN_PERCENT, MAX_MONTHS } from '@/components/ProductCard';
import { SkeletonGrid, ErrorState } from '@/components/States';

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

// ألوان فاتحة للمربعات (زي أقسام جرير)
const TILE_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-slate-200 text-slate-700',
];

export function HomePage() {
  const { lang, t, dir } = useLang();
  const isAr = lang === 'ar';
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
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
      const [catRes, featRes, brandRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false }),
        supabase.from('products').select('brand').eq('is_active', true),
      ]);
      if (!active) return;
      if (catRes.error || featRes.error) {
        setError(true);
      } else {
        setCategories(catRes.data as Category[]);
        setFeatured(featRes.data as Product[]);
      }
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

  // المنتج اللي يظهر في البانر الرئيسي: أول منتج مميز له صورة
  const hero = featured.find((p) => p.image_url) ?? null;
  const heroName = hero ? pickName(lang, hero.name_ar, hero.name_en) : '';
  const heroPrice = hero ? Number(hero.base_price || 0) : 0;

  const trustItems = [
    { icon: BadgeCheck, title: t('home.trust.genuine'), desc: t('home.trust.genuineDesc') },
    { icon: CreditCard, title: t('home.trust.installments'), desc: t('home.trust.installmentsDesc') },
    { icon: MessageCircle, title: t('home.trust.support'), desc: t('home.trust.supportDesc') },
  ];

  return (
    <div>
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

              {hero && heroPrice > 0 && (
                <Link
                  to={`/p/${hero.slug}`}
                  className="w-fit rounded-2xl border border-white/10 bg-ink-900 px-5 py-3 shadow-card transition-transform hover:-translate-y-0.5"
                >
                  <span className="block text-xs text-white/50">{heroName}</span>
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-2xl font-extrabold text-gold-300">
                      {formatCurrency(heroPrice, lang)}
                    </span>
                    {hero.installment_enabled && (
                      <span className="text-xs font-semibold text-gold-200">
                        {isAr ? 'أو ' : 'or '}
                        {formatCurrency(monthlyInstallment(heroPrice), lang)}
                        {isAr ? ' شهرياً' : ' / month'}
                      </span>
                    )}
                  </span>
                </Link>
              )}

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
              {hero ? (
                <Link to={`/p/${hero.slug}`} className="block h-56 w-56 sm:h-72 sm:w-72 lg:h-96 lg:w-96">
                  <ProductImage
                    imageUrl={hero.image_url}
                    brand={hero.brand}
                    name={heroName}
                    className=""
                  />
                </Link>
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-full bg-gold-gradient shadow-gold-lg sm:h-72 sm:w-72">
                  <img
                    src="/logo.png"
                    alt="King Phone"
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* بانرات التقسيط */}
      <section className="container-page mt-6 grid gap-4 sm:grid-cols-2">
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

      {/* شريط الماركات */}
      {brands.length > 0 && (
        <section className="container-page mt-10">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-2xl border border-white/5 bg-ink-900 px-6 py-5 shadow-card">
            {brands.map((b) => (
              <span key={b} className="text-lg font-extrabold uppercase tracking-wide text-white/35">
                {b}
              </span>
            ))}
          </div>
        </section>
      )}

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
