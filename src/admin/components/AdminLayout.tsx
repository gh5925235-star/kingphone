import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FolderTree, Settings, Store, LogOut, Menu, X, Languages } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/admin/context/AuthContext';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { ToastStack } from '@/admin/components/ui';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, key: 'nav.dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingCart, key: 'nav.orders', end: false },
  { to: '/admin/products', icon: Package, key: 'nav.products', end: false },
  { to: '/admin/categories', icon: FolderTree, key: 'nav.categories', end: false },
  { to: '/admin/settings', icon: Settings, key: 'nav.settings', end: false },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const { lang, toggle, dir, t } = useAdminLang();
  const navigate = useNavigate();
  const toasts = useToasts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (!active) return;
      if (!error && count != null) setPendingCount(count);
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItem = (item: (typeof NAV)[number]) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => setDrawerOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-gold-300/10 text-gold-200'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`
        }
      >
        <Icon size={18} />
        <span>{t(item.key)}</span>
        {item.key === 'nav.orders' && pendingCount > 0 && (
          <span className="ms-auto rounded-full bg-gold-300/20 px-2 py-0.5 text-[10px] font-bold text-gold-200">{pendingCount}</span>
        )}
      </NavLink>
    );
  };

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex flex-col leading-tight">
          <span className="bg-gold-gradient bg-clip-text text-base font-bold text-transparent">KING PHONE</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
            {t('admin.title')}
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">{NAV.map(navItem)}</nav>
      <div className="space-y-1 border-t border-white/5 px-3 py-3">
        <NavLink
          to="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Store size={18} />
          <span>{t('admin.viewStore')}</span>
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut size={18} />
          <span>{t('admin.logout')}</span>
        </button>
        <div className="px-4 pt-2 text-[11px] text-white/30 truncate" dir="ltr">
          {user?.email}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950" dir={dir}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 border-e border-white/5 bg-ink-900 lg:block">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-72 max-w-[85%] border-e border-white/5 bg-ink-900 animate-slide-in`}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarInner}
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/5 bg-ink-900/90 px-4 py-3 backdrop-blur lg:ps-64">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label={t('nav.menu')}
          >
            <Menu size={20} />
          </button>
          <button
            onClick={toggle}
            className="btn-ghost px-3 py-2 text-xs"
            aria-label="Language"
          >
            <Languages size={14} />
            <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 text-red-300/70 hover:bg-red-500/10 hover:text-red-200 lg:hidden"
          aria-label={t('admin.logout')}
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="lg:ps-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 lg:px-8 lg:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/5 bg-ink-900/95 backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-gold-200' : 'text-white/50'
                }`
              }
            >
              <Icon size={20} />
              <span className="truncate px-1">{t(item.key)}</span>
              {item.key === 'nav.orders' && pendingCount > 0 && (
                <span className="absolute end-1 top-0 rounded-full bg-gold-300/20 px-1.5 text-[9px] font-bold text-gold-200">{pendingCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {drawerOpen && (
        <button
          className="fixed top-3 z-[60] rounded-lg bg-white/10 p-2 text-white lg:hidden"
          style={dir === 'rtl' ? { left: 12 } : { right: 12 }}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}

      <ToastStack toasts={toasts.toasts} dismiss={toasts.dismiss} />
    </div>
  );
}
