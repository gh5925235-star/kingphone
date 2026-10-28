import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MessageCircle,
  Smartphone,
  Tablet,
  Headphones,
  Watch,
} from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';
import { useSeo } from '@/components/Seo';
import { ProductCard } from '@/components/ProductCard';
import { SkeletonGrid, ErrorState } from '@/components/States';

import type { LucideIcon } from 'lucide-react';

const categoryIcons: Record<string, LucideIcon> = {
  iphone: Smartphone,
  ipad: Tablet,
  airpods: Headphones,
  accessories: Watch,
};

export function HomePage() {
  const { lang, t, dir } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
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
      const [catRes, featRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false }),
      ]);
      if (!active) return;
      if (catRes.error || featRes.error) {
        setError(true);
      } else {
        setCategories(catRes.data as Category[]);
        setFeatured(featRes.data as Product[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const trustItems = [
    { icon: BadgeCheck, title: t('home.trust.genuine'), desc: t('home.trust.genuineDesc') },
    { icon: CreditCard, title: t('home.trust.installments'), desc: t('home.trust.installmentsDesc') },
    { icon: MessageCircle, title: t('home.trust.support'), desc: t('home.trust.supportDesc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gold-soft opacity-60" />
        <div className="absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-300/10 blur-3xl" />
        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center gap-6 animate-fade-in">
            <span className="badge-gold w-fit">{t('home.installmentsBadge')}</span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-gold-gradient">{t('home.heroTitle')}</span>
            </h1>
            <p className="max-w-xl text-lg text-white/70">{t('home.heroSubtitle')}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/c/iphone" className="btn-gold">
                {t('cta.shopNow')} <Arrow size={18} />
              </Link>
              <Link to="/c/iphone" className="btn-ghost">
                {t('cta.browseProducts')}
              </Link>
            </div>
          </div>
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="relative flex h-80 w-80 items-center justify-center rounded-full bg-gold-gradient shadow-gold-lg">
              <img
                src="/logo.png"
                alt="King Phone"
                className="h-full w-full rounded-full object-cover"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0')}
              />
            </div>
            <div className="absolute -end-4 top-8 rounded-2xl border border-white/10 bg-ink-800/80 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-gold-gradient">100%</p>
              <p className="text-xs text-white/60">{t('home.trust.genuine')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="container-page -mt-6 grid gap-4 sm:grid-cols-3">
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

      {/* Categories */}
      <section className="container-page mt-16">
        <SectionHeader title={t('home.categoriesTitle')} subtitle={t('home.categoriesSubtitle')} />
        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((c) => {
              const Icon = categoryIcons[c.slug] || Smartphone;
              const name = pickName(lang, c.name_ar, c.name_en);
              return (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="group card flex flex-col items-center gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/30 hover:shadow-gold animate-fade-in"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-300/10 text-gold-300 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={30} />
                  </span>
                  <span className="text-sm font-semibold text-white">{name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="container-page mt-16">
        <SectionHeader
          title={t('home.featuredTitle')}
          subtitle={t('home.featuredSubtitle')}
          action={
            <Link
              to="/c/iphone"
              className="flex items-center gap-1 text-sm font-medium text-gold-200 hover:text-gold-100"
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
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {featured.map((p) => (
              <div key={p.id} className="w-64 shrink-0">
                <ProductCard product={p} lang={lang} />
              </div>
            ))}
          </div>
        )}
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
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
