import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import {
  fetchProduct, upsertProduct, fetchVariants, upsertVariant, deleteVariant, fetchCategories,
} from '@/admin/lib/ordersApi';
import type { AdminProduct, AdminVariant, AdminCategory } from '@/admin/lib/types';

export function ProductEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Partial<AdminProduct>>({
    brand: 'Apple',
    slug: '',
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    base_price: 0,
    image_url: '',
    is_active: true,
    is_featured: false,
    installment_enabled: true,
    category_id: null,
  });
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch { /* ignore — category select just stays empty */ }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [p, v, cats] = await Promise.all([fetchProduct(id!), fetchVariants(id!), fetchCategories()]);
      setProduct(p);
      setVariants(v);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key: keyof AdminProduct, value: string | number | boolean | null) => {
    setProduct((prev) => ({ ...prev, [key]: value }));
  };

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const onSave = async () => {
    if (!product.name_ar || !product.name_en) {
      toasts.error(t('prod.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...product,
        slug: product.slug || slugify(product.name_en || product.name_ar || ''),
        base_price: Number(product.base_price || 0),
      } as Partial<AdminProduct> & { slug: string; name_ar: string; name_en: string; base_price: number; brand: string };
      const saved = await upsertProduct(payload);
      toasts.success(t('admin.success'));
      if (isNew) {
        navigate(`/admin/products/${saved.id}`);
      } else {
        await load();
      }
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    if (!id) return;
    const v: AdminVariant = {
      id: `tmp-${Date.now()}`,
      product_id: id,
      color_ar: '',
      color_en: '',
      color_hex: '#000000',
      capacity: '',
      price: Number(product.base_price || 0),
      stock: 0,
      image_url: '',
      is_active: true,
    };
    setVariants((prev) => [...prev, v]);
  };

  const updateVariant = (vid: string, patch: Partial<AdminVariant>) => {
    setVariants((prev) => prev.map((v) => (v.id === vid ? { ...v, ...patch } : v)));
  };

  const removeVariant = async (vid: string) => {
    if (vid.startsWith('tmp-')) {
      setVariants((prev) => prev.filter((v) => v.id !== vid));
      return;
    }
    try {
      await deleteVariant(vid);
      setVariants((prev) => prev.filter((v) => v.id !== vid));
      toasts.success(t('admin.deleted'));
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const saveVariant = async (v: AdminVariant) => {
    try {
      await upsertVariant({
        ...v,
        product_id: id!,
        price: Number(v.price),
        stock: Number(v.stock),
      });
      toasts.success(t('admin.success'));
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-white/50">
        <Loader2 size={20} className="animate-spin text-gold-300" />
        <span className="text-sm">{t('admin.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink dir={dir} />
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <AlertTriangle size={28} className="text-red-400" />
          <p className="max-w-md text-sm text-white/70" dir="ltr">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="space-y-6">
      <BackLink dir={dir} />
      <h1 className="text-2xl font-bold text-white">{isNew ? t('prod.new') : t('prod.edit')}</h1>

      <section className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('prod.nameAr')}>
            <input value={product.name_ar ?? ''} onChange={(e) => setField('name_ar', e.target.value)} className="input-field" dir="rtl" />
          </Field>
          <Field label={t('prod.nameEn')}>
            <input value={product.name_en ?? ''} onChange={(e) => { setField('name_en', e.target.value); if (isNew && !product.slug) setField('slug', slugify(e.target.value)); }} className="input-field" dir="ltr" />
          </Field>
          <Field label={t('prod.brand')}>
            <input value={product.brand ?? ''} onChange={(e) => setField('brand', e.target.value)} className="input-field" dir="ltr" />
          </Field>
          <Field label={t('prod.slug')}>
            <input value={product.slug ?? ''} onChange={(e) => setField('slug', e.target.value)} className="input-field" dir="ltr" />
            <p className="mt-1 text-[11px] text-white/30">{t('prod.slugHint')}</p>
          </Field>
          <Field label={t('prod.category')}>
            <select value={product.category_id ?? ''} onChange={(e) => setField('category_id', e.target.value || null)} className="input-field">
              <option value="">{t('prod.noCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name_en}</option>
              ))}
            </select>
          </Field>
          <Field label={t('prod.basePrice')}>
            <input type="number" step="0.001" value={product.base_price ?? 0} onChange={(e) => setField('base_price', e.target.value)} className="input-field" dir="ltr" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('prod.descriptionAr')}>
            <textarea value={product.description_ar ?? ''} onChange={(e) => setField('description_ar', e.target.value)} rows={3} className="input-field" dir="rtl" />
          </Field>
          <Field label={t('prod.descriptionEn')}>
            <textarea value={product.description_en ?? ''} onChange={(e) => setField('description_en', e.target.value)} rows={3} className="input-field" dir="ltr" />
          </Field>
        </div>

        <Field label={t('prod.imageUrl')}>
          <input value={product.image_url ?? ''} onChange={(e) => setField('image_url', e.target.value)} className="input-field" dir="ltr" placeholder="https://…" />
          <p className="mt-1 text-[11px] text-white/30">{t('prod.imageUrlHint')}</p>
        </Field>

        <div className="flex flex-wrap gap-4">
          <Toggle label={t('prod.isActive')} checked={!!product.is_active} onChange={(v) => setField('is_active', v)} />
          <Toggle label={t('prod.isFeatured')} checked={!!product.is_featured} onChange={(v) => setField('is_featured', v)} />
          <Toggle label={t('prod.installmentEnabled')} checked={!!product.installment_enabled} onChange={(v) => setField('installment_enabled', v)} />
        </div>

        <div className="flex justify-end">
          <button onClick={onSave} disabled={saving} className="btn-gold px-4 py-2 text-xs">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{t('prod.save')}</span>
          </button>
        </div>
      </section>

      {/* Variants editor — only after product is saved */}
      {!isNew && (
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">{t('prod.variants')}</h2>
            <button onClick={addVariant} className="btn-ghost px-3 py-1.5 text-xs">
              <Plus size={14} />
              <span>{t('prod.addVariant')}</span>
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-sm text-white/40">{t('prod.noVariants')}</p>
          ) : (
            <div className="space-y-4">
              {variants.map((v) => (
                <VariantRow
                  key={v.id}
                  variant={v}
                  lang={lang}
                  onChange={(patch) => updateVariant(v.id, patch)}
                  onSave={() => saveVariant(v)}
                  onDelete={() => removeVariant(v.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );

  function BackLink({ dir }: { dir: 'rtl' | 'ltr' }) {
    return (
      <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>{t('admin.back')}</span>
      </Link>
    );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
        checked ? 'border-gold-300/40 bg-gold-300/10 text-gold-200' : 'border-white/10 bg-ink-900 text-white/50'
      }`}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${checked ? 'border-gold-300 bg-gold-300' : 'border-white/30'}`} />
      <span>{label}</span>
    </button>
  );
}

function VariantRow({
  variant, lang, onChange, onSave, onDelete, t,
}: {
  variant: AdminVariant;
  lang: 'ar' | 'en';
  onChange: (patch: Partial<AdminVariant>) => void;
  onSave: () => void;
  onDelete: () => void;
  t: (k: string) => string;
}) {
  const isNew = variant.id.startsWith('tmp-');
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="label-field">{t('prod.colorAr')}</label>
          <input value={variant.color_ar} onChange={(e) => onChange({ color_ar: e.target.value })} className="input-field" dir="rtl" />
        </div>
        <div>
          <label className="label-field">{t('prod.colorEn')}</label>
          <input value={variant.color_en} onChange={(e) => onChange({ color_en: e.target.value })} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('prod.colorHex')}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={variant.color_hex} onChange={(e) => onChange({ color_hex: e.target.value })} className="h-10 w-10 rounded border border-white/10 bg-transparent" />
            <span className="text-xs text-white/40" dir="ltr">{variant.color_hex}</span>
          </div>
        </div>
        <div>
          <label className="label-field">{t('prod.capacity')}</label>
          <input value={variant.capacity} onChange={(e) => onChange({ capacity: e.target.value })} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('prod.price')}</label>
          <input type="number" step="0.001" value={variant.price} onChange={(e) => onChange({ price: Number(e.target.value) })} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('prod.stock')}</label>
          <input type="number" value={variant.stock} onChange={(e) => onChange({ stock: Number(e.target.value) })} className="input-field" dir="ltr" />
        </div>
        <div className="col-span-2">
          <label className="label-field">{t('prod.variantImage')}</label>
          <input value={variant.image_url ?? ''} onChange={(e) => onChange({ image_url: e.target.value })} className="input-field" dir="ltr" placeholder="https://…" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Toggle label={t('prod.isActive')} checked={variant.is_active} onChange={(v) => onChange({ is_active: v })} />
        <div className="flex gap-2">
          <button onClick={onSave} className="btn-gold px-3 py-1.5 text-xs">
            <Save size={12} />
            <span>{t('admin.save')}</span>
          </button>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {isNew && <p className="mt-2 text-[11px] text-gold-300/50">{lang === 'ar' ? 'لم يُحفظ بعد' : 'Not saved yet'}</p>}
    </div>
  );
}
