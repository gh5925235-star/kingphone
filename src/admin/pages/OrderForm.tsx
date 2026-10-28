import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchProducts, fetchVariants } from '@/admin/lib/ordersApi';
import type { AdminProduct, AdminVariant, AdminOrderStatus } from '@/admin/lib/types';
import type { OrderItemInput } from '@/admin/lib/ordersApi';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@/admin/lib/helpers';

export type OrderFormValues = {
  customer_name: string;
  phone: string;
  email: string;
  cpr: string;
  address: string;
  notes: string;
  admin_notes: string;
  items: OrderItemInput[];
  payment_type: 'full' | 'installment';
  payment_method: string;
  down_payment: number;
  installments_count: number | null;
  status: AdminOrderStatus;
  subtotal: number;
  total: number;
  paid_amount: number;
  lang: 'ar' | 'en';
};

export function OrderForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: OrderFormValues;
  submitLabel: string;
  onSubmit: (values: OrderFormValues) => Promise<void>;
}) {
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const [v, setV] = useState<OrderFormValues>(initial);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [variantCache, setVariantCache] = useState<Record<string, AdminVariant[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => { /* ignore */ });
  }, []);

  const subtotal = useMemo(
    () => v.items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0),
    [v.items],
  );
  const total = subtotal;

  const set = <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
  };

  const loadVariants = async (productId: string) => {
    if (variantCache[productId]) return;
    try {
      const vs = await fetchVariants(productId);
      setVariantCache((prev) => ({ ...prev, [productId]: vs }));
    } catch { /* ignore */ }
  };

  const addItem = () => {
    set('items', [...v.items, { product_id: null, variant_id: null, name: '', color: '', capacity: '', price: 0, qty: 1 }]);
  };

  const updateItem = (idx: number, patch: Partial<OrderItemInput>) => {
    setV((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    set('items', v.items.filter((_, i) => i !== idx));
  };

  const onProductChange = async (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (productId) await loadVariants(productId);
    updateItem(idx, {
      product_id: productId || null,
      variant_id: null,
      name: p ? (lang === 'ar' ? p.name_ar : p.name_en) : '',
      color: '',
      capacity: '',
      price: p ? Number(p.base_price) : 0,
    });
  };

  const onVariantChange = (idx: number, variantId: string) => {
    const it = v.items[idx];
    const variants = variantCache[it.product_id ?? ''] ?? [];
    const vr = variants.find((x) => x.id === variantId);
    updateItem(idx, {
      variant_id: variantId || null,
      color: vr ? (lang === 'ar' ? vr.color_ar : vr.color_en) : '',
      capacity: vr?.capacity ?? '',
      price: vr ? Number(vr.price) : Number(it.price),
    });
  };

  const save = async () => {
    if (v.items.length === 0) {
      toasts.error(t('new.noItems'));
      return;
    }
    if (!v.customer_name.trim()) {
      toasts.error(t('new.nameRequired'));
      return;
    }
    if (!v.phone.trim()) {
      toasts.error(t('new.phoneRequired'));
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...v, subtotal, total });
      toasts.success(t('admin.success'));
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={dir} className="space-y-6">
      {/* Customer */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">{t('new.customer')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field">{t('order.customerName')}</label>
            <input value={v.customer_name} onChange={(e) => set('customer_name', e.target.value)} className="input-field" dir="rtl" />
          </div>
          <div>
            <label className="label-field">{t('order.customerPhone')}</label>
            <input value={v.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" dir="ltr" />
          </div>
          <div>
            <label className="label-field">{t('order.customerCpr')}</label>
            <input value={v.cpr} onChange={(e) => set('cpr', e.target.value)} className="input-field" dir="ltr" />
          </div>
          <div>
            <label className="label-field">{t('order.customerAddress')}</label>
            <input value={v.address} onChange={(e) => set('address', e.target.value)} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">{t('order.customerEmail')}</label>
            <input value={v.email} onChange={(e) => set('email', e.target.value)} className="input-field" dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">{t('order.adminNotes')}</label>
            <textarea value={v.admin_notes} onChange={(e) => set('admin_notes', e.target.value)} rows={2} className="input-field" dir="rtl" />
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">{t('new.items')}</h2>
          <button onClick={addItem} className="btn-ghost px-3 py-1.5 text-xs">
            <Plus size={14} />
            <span>{t('new.addItem')}</span>
          </button>
        </div>

        {v.items.length === 0 ? (
          <p className="text-sm text-white/40">{t('new.noItems')}</p>
        ) : (
          <div className="space-y-3">
            {v.items.map((it, idx) => {
              const variants = variantCache[it.product_id ?? ''] ?? [];
              return (
                <div key={idx} className="rounded-xl border border-white/10 bg-ink-900 p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="label-field">{t('new.product')}</label>
                      <select
                        value={it.product_id ?? ''}
                        onChange={(e) => onProductChange(idx, e.target.value)}
                        className="input-field"
                      >
                        <option value="">{t('new.pickProduct')}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{lang === 'ar' ? p.name_ar : p.name_en}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-field">{t('new.variant')}</label>
                      <select
                        value={it.variant_id ?? ''}
                        onChange={(e) => onVariantChange(idx, e.target.value)}
                        className="input-field"
                        disabled={!it.product_id}
                      >
                        <option value="">{t('new.pickVariant')}</option>
                        {variants.map((vr) => (
                          <option key={vr.id} value={vr.id}>
                            {lang === 'ar' ? vr.color_ar : vr.color_en}
                            {vr.capacity ? ` · ${vr.capacity}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => removeItem(idx)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20">
                        <Trash2 size={12} />
                        <span>{t('admin.delete')}</span>
                      </button>
                    </div>
                    <div>
                      <label className="label-field">{t('new.qty')}</label>
                      <input type="number" min={1} value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} className="input-field" dir="ltr" />
                    </div>
                    <div>
                      <label className="label-field">{t('new.unitPrice')}</label>
                      <input type="number" step="0.001" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} className="input-field" dir="ltr" />
                    </div>
                    <div>
                      <label className="label-field">{t('order.col.lineTotal')}</label>
                      <div className="input-field bg-white/5 font-semibold text-white" dir="ltr">{(Number(it.price) * Number(it.qty)).toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Payment & totals */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">{t('new.payment')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field">{t('order.status')}</label>
            <select value={v.status} onChange={(e) => set('status', e.target.value as AdminOrderStatus)} className="input-field">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">{t('order.paymentType')}</label>
            <select
              value={v.payment_type}
              onChange={(e) => set('payment_type', e.target.value as 'full' | 'installment')}
              className="input-field"
            >
              <option value="full">{t('pay.full')}</option>
              <option value="installment">{t('pay.installment')}</option>
            </select>
          </div>
          <div>
            <label className="label-field">{t('order.paymentMethod')}</label>
            <select value={v.payment_method} onChange={(e) => set('payment_method', e.target.value)} className="input-field">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{t(`doc.method.${m}`)}</option>
              ))}
            </select>
          </div>
          {v.payment_type === 'installment' && (
            <>
              <div>
                <label className="label-field">{t('order.downPayment')}</label>
                <input type="number" step="0.001" min={0} value={v.down_payment} onChange={(e) => set('down_payment', Number(e.target.value))} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="label-field">{t('order.months')}</label>
                <input type="number" min={1} value={v.installments_count ?? 3} onChange={(e) => set('installments_count', Number(e.target.value))} className="input-field" dir="ltr" />
              </div>
            </>
          )}
        </div>

        <dl className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/55">{t('order.subtotal')}</dt>
            <dd className="text-white/85" dir="ltr">{subtotal.toFixed(3)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/55">{t('order.total')}</dt>
            <dd className="font-bold text-gold-200" dir="ltr">{total.toFixed(3)}</dd>
          </div>
        </dl>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-gold px-4 py-2 text-xs">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </div>
  );
}
