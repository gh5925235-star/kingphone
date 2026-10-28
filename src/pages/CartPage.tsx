import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';
import { pickName } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';
import { useSeo } from '@/components/Seo';
import { ProductImage } from '@/components/ProductCard';
import { EmptyState } from '@/components/States';

export function CartPage() {
  const { lang, t } = useLang();
  const { settings } = useSettings();
  const { items, subtotal, updateQty, removeItem, clear, count } = useCart();

  useSeo({ title: t('cart.title') });

  if (items.length === 0) {
    return (
      <div className="container-page py-10">
        <EmptyState title={t('cart.empty')} subtitle={t('cart.emptyDesc')} />
        <div className="mt-6 text-center">
          <Link to="/" className="btn-gold">
            {t('cta.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <ShoppingBag size={22} className="text-gold-300" />
          {t('cart.title')}
          <span className="text-sm font-normal text-white/40">({count})</span>
        </h1>
        <button onClick={clear} className="text-sm text-red-400/80 hover:text-red-400">
          {t('cart.clear')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const name = pickName(lang, item.nameAr, item.nameEn);
            const color = pickName(lang, item.colorAr, item.colorEn);
            return (
              <div key={item.variantId} className="card flex gap-4 p-4">
                <Link
                  to={`/p/${item.slug}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-900"
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
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.variantId, item.qty - 1)}
                        className="rounded-md border border-white/10 p-1.5 text-white/70 hover:border-gold-300/40 hover:text-white"
                        aria-label="Decrease"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.variantId, item.qty + 1)}
                        className="rounded-md border border-white/10 p-1.5 text-white/70 hover:border-gold-300/40 hover:text-white"
                        aria-label="Increase"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(item.price * item.qty, lang, settings?.currency)}
                      </span>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-red-400/80 hover:text-red-400"
                        aria-label={t('cart.removeItem')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="card h-fit space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">{t('cart.subtotal')}</span>
            <span className="text-xl font-bold text-gold-gradient">
              {formatCurrency(subtotal, lang, settings?.currency)}
            </span>
          </div>
          <Link to="/checkout" className="btn-gold w-full">
            {t('cart.proceedCheckout')}
          </Link>
          <Link to="/" className="btn-ghost w-full">
            {t('cta.continueShopping')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
