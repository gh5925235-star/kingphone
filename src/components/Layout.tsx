import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { CartDrawer } from '@/components/CartDrawer';

export function Layout() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <Header onOpenCart={() => setCartOpen(true)} />
      <main className="flex-1" key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
