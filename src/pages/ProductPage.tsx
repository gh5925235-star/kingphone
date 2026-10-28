import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Minus, Plus, ShieldCheck, ShoppingCart, Zap } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useCart, type CartItem } from '@/context/CartContext';
import { supabase, type Product, type ProductVariant } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';
import { useSeo } from '@/components/Seo';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductCard';
import { LoadingState, ErrorState } from '@/components/States';

export function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { settings } = useSettings();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [months, setMonths] = useState<number | null>(null);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [added, setAdded] = useState(false);

  useSeo({
    title: product ? pickName(lang, product.name_ar, product.name_en) : undefined,
    description: product ? pickName(lang, product.description_ar, product.description_en) ?? undefined : undefined,
    image: product?.image_url ?? undefined,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      setSelectedColor(null);
      setSelectedCapacity(null);
      setQty(1);
      const prodRes = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!active) return;
      if (prodRes.error || !prodRes.data) {
        setError(true);
        setLoading(false);
        return;
      }
      const prod = prodRes.data as Product;
      setProduct(prod);
      const varRes = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', prod.id)
        .eq('is_active', true);
      if (!active) return;
      if (varRes.error) {
        setError(true);
        setLoading(false);
        return;
      }
      const vars = varRes.data as ProductVariant[];
      setVariants(vars);
      // Pre-select first color
      const firstColor = vars[0]?.color_en ?? null;
      if (firstColor) {
        setSelectedColor(firstColor);
        const capsForColor = vars.filter((v) => v.color_en === firstColor);
        if (capsForColor[0]) setSelectedCapacity(capsForColor[0].capacity);
      }
      // Related products
      if (prod.category_id) {
        const relRes = await supabase
          .from('products')
          .select('*')
          .eq('category_id', prod.category_id)
          .eq('is_active', true)
          .neq('id', prod.id)
          .limit(4);
        if (!active) return;
        if (!relRes.error) setRelated(relRes.data as Product[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  // Colors available (unique by color_en)
  const colors = useMemo(() => {
    const map = new Map<string, { en: string; ar: string; hex: string }>();
    for (const v of variants) {
      if (!map.has(v.color_en)) {
        map.set(v.color_en, { en: v.color_en, ar: v.color_ar, hex: v.color_hex });
      }
    }
    return Array.from(map.values());
  }, [variants]);

  // Capacities available for the selected color
  const capacities = useMemo(() => {
    if (!selectedColor) return [];
    return variants
      .filter((v) => v.color_en === selectedColor)
      .map((v) => ({ capacity: v.capacity, inStock: v.stock > 0 }));
  }, [variants, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedCapacity) return null;
    return (
      variants.find((v) => v.color_en === selectedColor && v.capacity === selectedCapacity) ?? null
    );
  }, [variants, selectedColor, selectedCapacity]);

  // Initialize installment defaults when settings load
  useEffect(() => {
    if (settings && settings.defaultMonths.length > 0 && months === null) {
      setMonths(settings.defaultMonths[0]);
    }
  }, [settings, months]);

  const price = selectedVariant?.price ?? product?.base_price ?? 0;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;

  const minDownPercent = settings?.minDownPaymentPercent ?? 0;
  const minDown = (price * minDownPercent) / 100;
  const effectiveDown = Math.max(downPayment, minDown);
  const monthly = months && months > 0 ? (price - effectiveDown) / months : 0;

  const handleCapacityClick = (cap: string) => {
    setSelectedCapacity(cap);
  };

  const buildCartItem = (quantity: number): CartItem | null => {
    if (!product || !selectedVariant) return null;
    return {
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      brand: product.brand,
      nameAr: product.name_ar,
      nameEn: product.name_en,
      colorAr: selectedVariant.color_ar,
      colorEn: selectedVariant.color_en,
      colorHex: selectedVariant.color_hex,
      capacity: selectedVariant.capacity,
      imageUrl: selectedVariant.image_url ?? product.image_url,
      price: selectedVariant.price,
      qty: quantity,
      months: months ?? undefined,
      downPayment: effectiveDown || undefined,
    };
  };

  const handleAddToCart = () => {
    const item = buildCartItem(qty);
    if (!item) return;
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const item = buildCartItem(qty);
    if (!item) return;
    addItem(item);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="container-page py-10">
        <LoadingState />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-page py-10">
        <ErrorState />
      </div>
    );
  }

  const name = pickName(lang, product.name_ar, product.name_en);
  const description = pickName(lang, product.description_ar, product.description_en);

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-white/40">
        <Link to="/" className="hover:text-gold-200">
          {t('nav.home')}
        </Link>
        <span>/</span>
        {product.category_id && (
          <Link to={`/c/iphone`} className="hover:text-gold-200">
            {product.brand}
          </Link>
        )}
        <span>/</span>
        <span className="text-white/60">{name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="card aspect-square overflow-hidden p-6">
          <ProductImage
            imageUrl={selectedVariant?.image_url ?? product.image_url}
            brand={product.brand}
            name={name}
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gold-300">
              {product.brand}
            </span>
            <h1 className="mt-1 text-3xl font-bold text-white">{name}</h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {selectedVariant ? (
              <span className="text-3xl font-bold text-gold-gradient">
                {formatCurrency(selectedVariant.price, lang, settings?.currency)}
              </span>
            ) : (
              <span className="text-2xl font-bold text-gold-gradient">
                {formatCurrency(product.base_price, lang, settings?.currency)}
              </span>
            )}
            {product.installment_enabled && (
              <span className="badge-gold">{t('card.installments')}</span>
            )}
          </div>

          {/* Stock */}
          {selectedVariant && (
            <p className={`text-sm font-medium ${inStock ? 'text-green-400' : 'text-red-400'}`}>
              {inStock ? t('product.inStock') : t('product.outOfStock')}
            </p>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <label className="label-field">{t('product.color')}</label>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => {
                  const isActive = selectedColor === c.en;
                  return (
                    <button
                      key={c.en}
                      onClick={() => {
                        setSelectedColor(c.en);
                        const caps = variants.filter((v) => v.color_en === c.en);
                        if (caps[0]) setSelectedCapacity(caps[0].capacity);
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                        isActive
                          ? 'border-gold-300/60 bg-gold-300/10 text-white'
                          : 'border-white/10 text-white/60 hover:border-gold-300/30'
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-white/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      {pickName(lang, c.ar, c.en)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Capacities */}
          {capacities.length > 0 && (
            <div>
              <label className="label-field">{t('product.capacity')}</label>
              <div className="flex flex-wrap gap-2">
                {capacities.map((c) => {
                  const isActive = selectedCapacity === c.capacity;
                  return (
                    <button
                      key={c.capacity}
                      onClick={() => handleCapacityClick(c.capacity)}
                      disabled={!c.inStock}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                        isActive
                          ? 'border-gold-300/60 bg-gold-300/10 text-white'
                          : 'border-white/10 text-white/60 hover:border-gold-300/30'
                      }`}
                    >
                      {c.capacity}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900 p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="rounded-lg p-2 text-white/70 hover:text-white"
                aria-label="Decrease"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-white">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="rounded-lg p-2 text-white/70 hover:text-white"
                aria-label="Increase"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || !inStock}
              className="btn-gold"
            >
              {added ? (
                <>
                  <Check size={18} /> {t('cart.added')}
                </>
              ) : (
                <>
                  <ShoppingCart size={18} /> {t('cta.addToCart')}
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!selectedVariant || !inStock}
              className="btn-ghost"
            >
              <Zap size={18} /> {t('cta.buyNow')}
            </button>
          </div>

          {/* Installment calculator */}
          {product.installment_enabled && settings && settings.defaultMonths.length > 0 && (
            <div className="card space-y-4 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck size={18} className="text-gold-300" />
                {t('product.installmentCalc')}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">{t('product.months')}</label>
                  <div className="flex flex-wrap gap-2">
                    {settings.defaultMonths.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          months === m
                            ? 'border-gold-300/60 bg-gold-300/10 text-white'
                            : 'border-white/10 text-white/60 hover:border-gold-300/30'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-field">{t('product.downPayment')}</label>
                  <input
                    type="number"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    placeholder={minDown.toFixed(3)}
                    className="input-field"
                    min={minDown}
                    step="0.001"
                  />
                  <p className="mt-1 text-xs text-white/40">
                    {t('product.minDownHint', { percent: minDownPercent })}
                  </p>
                </div>
              </div>
              {months && months > 0 && (
                <div className="rounded-xl bg-gold-300/10 p-4">
                  <p className="text-xs text-white/50">{t('product.monthlyAmount')}</p>
                  <p className="text-2xl font-bold text-gold-gradient">
                    {formatCurrency(Math.max(0, monthly), lang, settings?.currency)}
                  </p>
                </div>
              )}
              <p className="text-xs text-white/40">{t('product.installmentNote')}</p>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">{t('product.description')}</h3>
              <p className="text-sm leading-relaxed text-white/60">{description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-white">{t('product.related')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
