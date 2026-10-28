import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { ProductImage } from '@/components/ProductCard';
import { formatCurrency } from '@/lib/format';
import { pickName } from '@/lib/i18n';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, updateQty, removeItem, count } = useCart();
  const { lang, t } = useLang();
  const { settings } = useSettings();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-ink-900 shadow-card transition-transform duration-300 ${
          open ? 'translate-x-0' : 'rtl:-translate-x-full ltr:translate-x-full'
        } end-0`}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-white/5 p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <ShoppingBag size={18} className="text-gold-300" />
            {t('cart.title')}
            {count > 0 && <span className="text-xs text-white/40">({count})</span>}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-ink-700 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <ShoppingBag size={32} className="text-white/30" />
              <p className="font-semibold text-white">{t('cart.empty')}</p>
              <p className="text-sm text-white/50">{t('cart.emptyDesc')}</p>
              <Link to="/" onClick={onClose} className="btn-gold mt-2">
                {t('cta.continueShopping')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((item) => {
                const name = pickName(lang, item.nameAr, item.nameEn);
                const color = pickName(lang, item.colorAr, item.colorEn);
                return (
                  <li key={item.variantId} className="flex gap-3 p-4">
                    <Link
                      to={`/p/${item.slug}`}
                      onClick={onClose}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-800"
                    >
                      <ProductImage imageUrl={item.imageUrl} brand={item.brand} name={name} />
                    </Link>
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <p className="text-xs text-white/50">
                        {color} · {item.capacity}
                      </p>
                      <p className="text-sm font-bold text-gold-200">
                        {formatCurrency(item.price, lang, settings?.currency)}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.variantId, item.qty - 1)}
                            className="rounded-md border border-white/10 p-1 text-white/70 transition-colors hover:border-gold-300/40 hover:text-white"
                            aria-label="Decrease"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-white">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.variantId, item.qty + 1)}
                            className="rounded-md border border-white/10 p-1 text-white/70 transition-colors hover:border-gold-300/40 hover:text-white"
                            aria-label="Increase"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="flex items-center gap-1 text-xs text-red-400/80 transition-colors hover:text-red-400"
                        >
                          <Trash2 size={14} /> {t('cart.removeItem')}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="space-y-3 border-t border-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t('cart.subtotal')}</span>
              <span className="text-lg font-bold text-gold-gradient">
                {formatCurrency(subtotal, lang, settings?.currency)}
              </span>
            </div>
            <Link to="/checkout" onClick={onClose} className="btn-gold w-full">
              {t('cart.proceedCheckout')}
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
