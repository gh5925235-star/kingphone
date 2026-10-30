import { Crown } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import type { Lang } from '@/lib/i18n';
import { pickName, tr } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';

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
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className={`h-full w-full object-contain ${className}`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          const fallback = (e.currentTarget.nextElementSibling as HTMLElement) || null;
          if (fallback) fallback.style.display = 'flex';
        }}
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

  return (
    <a
      href={href}
      className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/30 hover:shadow-gold animate-fade-in"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink-900 bg-[radial-gradient(circle_at_50%_40%,rgba(215,25,32,0.06),transparent_65%)] p-6">
        <ProductImage
          imageUrl={product.image_url}
          brand={product.brand}
          name={name}
          className="drop-shadow-[0_14px_18px_rgba(15,23,42,0.22)] transition-transform duration-500 group-hover:scale-105"
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
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{name}</h3>
        <div className="mt-auto pt-3">
          <span className="block text-[11px] text-white/40">
            {tr(lang, 'card.startingFrom')}
          </span>
          <span className="text-base font-bold text-gold-gradient">
            {formatCurrency(minPrice, lang)}
          </span>
        </div>
      </div>
    </a>
  );
}
