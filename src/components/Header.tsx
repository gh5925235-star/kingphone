import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Crown, Languages, Menu, ShoppingCart, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useLang } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';

export function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { lang, toggle, t } = useLang();
  const { count } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/5 bg-ink-950/90 backdrop-blur-md'
          : 'border-b border-transparent bg-ink-950'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center" aria-label={t('brand.name')}>
          <Logo size="md" showText={false} />
          <span className="ms-2 hidden flex-col leading-tight sm:flex">
            <span className="text-base font-bold text-gold-gradient">KING PHONE</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
              iPhone Specialist · Bahrain
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavItem to="/">{t('nav.home')}</NavItem>
          {categories.map((c) => (
            <NavItem key={c.id} to={`/c/${c.slug}`}>
              {pickName(lang, c.name_ar, c.name_en)}
            </NavItem>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
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

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-white/10 bg-ink-800 p-2.5 text-white/80 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

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

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'text-gold-200' : 'text-white/70 hover:text-white'
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
          isActive ? 'bg-ink-800 text-gold-200' : 'text-white/70 hover:bg-ink-800 hover:text-white'
        }`
      }
    >
      <Crown size={16} className="text-gold-300/60" />
      {children}
    </NavLink>
  );
}
