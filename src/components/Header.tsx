import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Languages, Menu, Search, ShoppingCart, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ProductImage } from '@/components/ProductCard';
import { useLang } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/lib/supabase';
import { pickName, type Lang } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';

type Hit = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  brand: string;
  base_price: number;
  image_url: string | null;
};

export function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { lang, toggle, t } = useLang();
  const { count } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) setCategories(data as Category[]);
    })();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/95 backdrop-blur-md">
      {/* الصف الأول: اللوجو + البحث (ديسكتوب) + اللغة + السلة */}
      <div className="container-page flex h-16 items-center gap-3 sm:gap-4">
        <Link to="/" className="flex shrink-0 items-center" aria-label={t('brand.name')}>
          <Logo size="md" showText={false} />
          <span className="ms-2 hidden flex-col leading-tight sm:flex">
            <span className="text-base font-bold text-gold-gradient">KING PHONE</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
              iPhone Specialist · Bahrain
            </span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBox lang={lang} />
        </div>

        <div className="ms-auto flex items-center gap-1.5 md:ms-0">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-gold-300/40 hover:text-white"
            aria-label="Toggle language"
          >
            <Languages size={16} className="text-gold-300" />
            {t('lang.toggle')}
          </button>

          <button
            onClick={onOpenCart}
            className="relative rounded-lg border border-white/10 bg-ink-800 p-2.5 text-white/80 transition-colors hover:border-gold-300/40 hover:text-white"
            aria-label={t('nav.cart')}
          >
            <ShoppingCart size={18} />
            {count > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold-gradient px-1 text-[10px] font-bold text-ink-950">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* موبايل: البحث + زرار القائمة */}
      <div className="container-page flex items-center gap-2 pb-3 md:hidden">
        <div className="flex-1">
          <SearchBox lang={lang} />
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-full border border-white/10 bg-ink-800 p-3 text-white/80"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ديسكتوب: شريط الأقسام */}
      <nav className="hidden border-t border-white/5 md:block">
        <div className="container-page flex items-center gap-1 overflow-x-auto no-scrollbar">
          <NavItem to="/">{t('nav.home')}</NavItem>
          {categories.map((c) => (
            <NavItem key={c.id} to={`/c/${c.slug}`}>
              {pickName(lang, c.name_ar, c.name_en)}
            </NavItem>
          ))}
        </div>
      </nav>

      {mobileOpen && (
        <nav className="border-t border-white/5 bg-ink-950 md:hidden">
          <div className="container-page flex flex-col py-2">
            <MobileNavItem to="/">{t('nav.home')}</MobileNavItem>
            {categories.map((c) => (
              <MobileNavItem key={c.id} to={`/c/${c.slug}`}>
                {pickName(lang, c.name_ar, c.name_en)}
              </MobileNavItem>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

/* ------------------------------ شريط البحث ------------------------------ */

function SearchBox({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // اقفل القائمة لما تدوس بره
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // بحث مباشر بعد ما توقف عن الكتابة (ربع ثانية)
  useEffect(() => {
    const term = q.trim().replace(/[%,()*]/g, ' ').trim();
    if (term.length < 2) {
      setHits([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    let cancelled = false;
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, slug, name_ar, name_en, brand, base_price, image_url')
        .eq('is_active', true)
        .or(`name_ar.ilike.%${term}%,name_en.ilike.%${term}%,brand.ilike.%${term}%`)
        .limit(8);
      if (cancelled) return;
      setHits((data as Hit[] | null) ?? []);
      setBusy(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q]);

  const go = (slug: string) => {
    setOpen(false);
    setQ('');
    navigate(`/p/${slug}`);
  };

  const showPanel = open && q.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (hits[0]) go(hits[0].slug);
        }}
      >
        <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-gold-300" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={isAr ? 'ابحث في كنج فون' : 'Search King Phone'}
          className="w-full rounded-full border border-white/10 bg-tint-100 py-2.5 ps-11 pe-4 text-sm text-white placeholder:text-white/40 focus:border-gold-300/50 focus:outline-none"
        />
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-ink-900 p-2 shadow-card">
          {busy && hits.length === 0 ? (
            <p className="p-3 text-center text-sm text-white/50">{isAr ? 'جاري البحث…' : 'Searching…'}</p>
          ) : hits.length === 0 ? (
            <p className="p-3 text-center text-sm text-white/50">{isAr ? 'لا توجد نتائج' : 'No results'}</p>
          ) : (
            hits.map((h) => {
              const name = pickName(lang, h.name_ar, h.name_en);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => go(h.slug)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors hover:bg-tint-100"
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-tint-100 p-1">
                    <ProductImage imageUrl={h.image_url} brand={h.brand} name={name} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{name}</span>
                    <span className="block text-[11px] text-white/45">{h.brand}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-gold-300">
                    {formatCurrency(Number(h.base_price || 0), lang)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'text-gold-300' : 'text-white/70 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function MobileNavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
          isActive ? 'bg-ink-800 text-gold-300' : 'text-white/70 hover:bg-ink-800 hover:text-white'
        }`
      }
    >
      <Crown size={16} className="text-gold-300/60" />
      {children}
    </NavLink>
  );
}
