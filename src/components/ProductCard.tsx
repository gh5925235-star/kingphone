import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import type { Lang } from '@/lib/i18n';
import { pickName, tr } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';

// تقدير القسط الشهري (زي صفحة المنتج): دفعة مقدمة 20% والباقي على 12 شهر.
// لو غيّرت الشروط، عدّل الرقمين دول بس.
export const MIN_DOWN_PERCENT = 0.2;
export const MAX_MONTHS = 12;
export function monthlyInstallment(price: number): number {
  return (price * (1 - MIN_DOWN_PERCENT)) / MAX_MONTHS;
}

export function ProductImage({
  imageUrl,
  brand,
  name,
  className = '',
}: {
  imageUrl: string | null | undefined;
  brand: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className={`h-full w-full object-contain mix-blend-multiply ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gold-soft p-4 text-center ${className}`}
    >
      <Crown size={28} className="text-gold-300/70" />
      <span className="text-sm font-semibold text-gold-200">{brand}</span>
      <span className="text-xs text-white/60">{name}</span>
    </div>
  );
}

export function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const name = pickName(lang, product.name_ar, product.name_en);
  const href = `/p/${product.slug}`;
  const minPrice = Number(product.base_price || 0);
  const isAr = lang === 'ar';
  const showMonthly = product.installment_enabled && minPrice > 0;

  return (
    <a
      href={href}
      className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/30 hover:shadow-gold animate-fade-in"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-tint-50 to-tint-100 p-6">
        <ProductImage
          imageUrl={product.image_url}
          brand={product.brand}
          name={name}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {product.installment_enabled && (
          <span className="absolute start-3 top-3 badge-gold">
            {tr(lang, 'card.installments')}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">
          {product.brand}
        </span>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-white">{name}</h3>
        <div className="mt-auto pt-3">
          <span className="block text-[11px] text-white/45">
            {tr(lang, 'card.startingFrom')}
          </span>
          <span className="text-xl font-extrabold text-gold-300">
            {formatCurrency(minPrice, lang)}
          </span>
          {showMonthly && (
            <span className="mt-2 block rounded-lg bg-gold-50 px-2.5 py-1.5 text-[11px] font-semibold text-gold-200">
              {isAr ? 'أو ' : 'or '}
              {formatCurrency(monthlyInstallment(minPrice), lang)}
              {isAr ? ' شهرياً' : ' / month'}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
