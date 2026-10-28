import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';
import { supabase, type CreateOrderCustomer, type CreateOrderItem } from '@/lib/supabase';
import { pickName } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';
import { useSeo } from '@/components/Seo';
import { ProductImage } from '@/components/ProductCard';

type PaymentType = 'full' | 'installment';
type PaymentMethod = 'benefit' | 'whatsapp';

type FormState = {
  name: string;
  phone: string;
  email: string;
  cpr: string;
  address: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState | 'downPayment', string>>;

export function CheckoutPage() {
  const { lang, t } = useLang();
  const { settings } = useSettings();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '+973',
    email: '',
    cpr: '',
    address: '',
    notes: '',
  });
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('whatsapp');
  const [months, setMonths] = useState<number | null>(null);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useSeo({ title: t('checkout.title') });

  // Initialize months from settings or cart item
  const cartInstallment = useMemo(
    () => items.find((i) => i.months && i.downPayment !== undefined),
    [items],
  );

  useMemo(() => {
    if (settings && months === null) {
      setMonths(cartInstallment?.months ?? settings.defaultMonths[0] ?? 3);
    }
    if (cartInstallment?.downPayment !== undefined && downPayment === 0) {
      setDownPayment(cartInstallment.downPayment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, cartInstallment]);

  const total = subtotal;
  const minDownPercent = settings?.minDownPaymentPercent ?? 0;
  const minDown = (total * minDownPercent) / 100;
  const effectiveDown = Math.max(downPayment, paymentType === 'installment' ? minDown : 0);
  const monthly = months && months > 0 ? (total - effectiveDown) / months : 0;

  if (items.length === 0) {
    return (
      <div className="container-page py-10">
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-sm text-white/60">{t('checkout.cartEmpty')}</p>
          <Link to="/" className="btn-gold">
            {t('cta.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = t('checkout.required');
    if (!form.phone.trim()) e.phone = t('checkout.required');
    else if (!/^\+?\d{8,15}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = t('checkout.phoneInvalid');
    if (paymentType === 'installment' && !form.cpr.trim())
      e.cpr = t('checkout.cprRequiredMsg');
    if (paymentType === 'installment' && downPayment < minDown)
      e.downPayment = t('checkout.downPaymentLow', { min: formatCurrency(minDown, lang, settings?.currency) });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);

    const customer: CreateOrderCustomer = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      cpr: form.cpr.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      lang,
    };

    const pItems: CreateOrderItem[] = items.map((i) => ({
      variant_id: i.variantId,
      qty: i.qty,
      product_id: i.productId,
      name_ar: i.nameAr,
      name_en: i.nameEn,
      color_ar: i.colorAr,
      color_en: i.colorEn,
      capacity: i.capacity,
    }));

    const { data, error } = await supabase.rpc('create_order', {
      p_customer: customer,
      p_items: pItems,
      p_payment_type: paymentType,
      p_payment_method: paymentMethod,
      p_down_payment: paymentType === 'installment' ? effectiveDown : 0,
      p_months: paymentType === 'installment' ? months : null,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message || t('error.generic'));
      return;
    }

    const result = data as { id: string; order_number: string; total: number } | null;
    if (!result) {
      setSubmitError(t('error.generic'));
      return;
    }

    // Stash confirmation data for refresh safety
    const confirmationData = {
      orderNumber: result.order_number,
      total: result.total,
      customer,
      items: items.map((i) => ({
        name: pickName(lang, i.nameAr, i.nameEn),
        color: pickName(lang, i.colorAr, i.colorEn),
        capacity: i.capacity,
        qty: i.qty,
        price: i.price,
      })),
      paymentType,
      months: paymentType === 'installment' ? months : null,
      downPayment: paymentType === 'installment' ? effectiveDown : 0,
    };
    try {
      sessionStorage.setItem('kp_last_order', JSON.stringify(confirmationData));
    } catch {
      // ignore
    }

    clear();
    navigate(`/order/${result.order_number}`, { state: confirmationData });
  };

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">{t('checkout.title')}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer details */}
          <div className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-white">{t('checkout.customer')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('checkout.name')}
                value={form.name}
                onChange={(v) => setField('name', v)}
                error={errors.name}
                required
              />
              <Field
                label={t('checkout.phone')}
                value={form.phone}
                onChange={(v) => setField('phone', v)}
                error={errors.phone}
                hint={t('checkout.phoneHint')}
                required
                dir="ltr"
              />
              <Field
                label={t('checkout.email')}
                value={form.email}
                onChange={(v) => setField('email', v)}
                error={errors.email}
                dir="ltr"
              />
              <Field
                label={
                  paymentType === 'installment'
                    ? `${t('checkout.cpr')} — ${t('checkout.cprRequired')}`
                    : `${t('checkout.cpr')} — ${t('checkout.cprOptional')}`
                }
                value={form.cpr}
                onChange={(v) => setField('cpr', v)}
                error={errors.cpr}
                dir="ltr"
              />
            </div>
            <Field
              label={t('checkout.address')}
              value={form.address}
              onChange={(v) => setField('address', v)}
              error={errors.address}
              textarea
            />
            <Field
              label={t('checkout.notes')}
              value={form.notes}
              onChange={(v) => setField('notes', v)}
              error={errors.notes}
              textarea
            />
          </div>

          {/* Payment */}
          <div className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-white">{t('checkout.paymentType')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setPaymentType('full')}
                className={`rounded-xl border p-4 text-start transition-all ${
                  paymentType === 'full'
                    ? 'border-gold-300/60 bg-gold-300/10'
                    : 'border-white/10 hover:border-gold-300/30'
                }`}
              >
                <span className="block text-sm font-semibold text-white">
                  {t('checkout.fullPayment')}
                </span>
              </button>
              <button
                onClick={() => setPaymentType('installment')}
                className={`rounded-xl border p-4 text-start transition-all ${
                  paymentType === 'installment'
                    ? 'border-gold-300/60 bg-gold-300/10'
                    : 'border-white/10 hover:border-gold-300/30'
                }`}
              >
                <span className="block text-sm font-semibold text-white">
                  {t('checkout.installment')}
                </span>
              </button>
            </div>

            {paymentType === 'installment' && settings && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">{t('checkout.months')}</label>
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
                  <label className="label-field">{t('checkout.downPayment')}</label>
                  <input
                    type="number"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    placeholder={minDown.toFixed(3)}
                    className="input-field"
                    min={minDown}
                    step="0.001"
                    dir="ltr"
                  />
                  {errors.downPayment && (
                    <p className="mt-1 text-xs text-red-400">{errors.downPayment}</p>
                  )}
                  {months && months > 0 && (
                    <p className="mt-2 text-sm text-white/60">
                      {t('checkout.monthly')}:{' '}
                      <span className="font-bold text-gold-gradient">
                        {formatCurrency(Math.max(0, monthly), lang, settings?.currency)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment method */}
            <div>
              <label className="label-field">{t('checkout.paymentType')}</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`flex-1 rounded-xl border p-3 text-sm font-medium transition-all ${
                    paymentMethod === 'whatsapp'
                      ? 'border-gold-300/60 bg-gold-300/10 text-white'
                      : 'border-white/10 text-white/60 hover:border-gold-300/30'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setPaymentMethod('benefit')}
                  className={`flex-1 rounded-xl border p-3 text-sm font-medium transition-all ${
                    paymentMethod === 'benefit'
                      ? 'border-gold-300/60 bg-gold-300/10 text-white'
                      : 'border-white/10 text-white/60 hover:border-gold-300/30'
                  }`}
                >
                  Benefit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-white">{t('checkout.summary')}</h2>
          <ul className="space-y-3">
            {items.map((item) => {
              const name = pickName(lang, item.nameAr, item.nameEn);
              const color = pickName(lang, item.colorAr, item.colorEn);
              return (
                <li key={item.variantId} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                    <ProductImage imageUrl={item.imageUrl} brand={item.brand} name={name} />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-xs font-semibold text-white">{name}</p>
                    <p className="text-[11px] text-white/40">
                      {color} · {item.capacity}
                    </p>
                    <p className="text-xs text-gold-200">
                      {item.qty} × {formatCurrency(item.price, lang, settings?.currency)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t('checkout.total')}</span>
              <span className="text-xl font-bold text-gold-gradient">
                {formatCurrency(total, lang, settings?.currency)}
              </span>
            </div>
            {paymentType === 'installment' && months && (
              <p className="mt-1 text-xs text-white/40">
                {t('checkout.monthly')}: {formatCurrency(Math.max(0, monthly), lang, settings?.currency)}
              </p>
            )}
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400">{submitError}</p>
          )}

          <button onClick={handleSubmit} disabled={submitting} className="btn-gold w-full">
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t('checkout.submitting')}
              </>
            ) : (
              t('checkout.submit')
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  textarea,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  textarea?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div>
      <label className="label-field">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field min-h-[80px] resize-y"
          dir={dir}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          dir={dir}
        />
      )}
      {hint && !error && <p className="mt-1 text-xs text-white/40">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
