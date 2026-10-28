import { useEffect, useState } from 'react';
import { Save, Loader2, AlertTriangle, Store, Phone, CreditCard, Info } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchSettings, saveSettings, SETTINGS_FIELDS, type SettingsField } from '@/admin/lib/settingsApi';
import type { AdminSettings } from '@/admin/lib/types';

const GROUP_META: Record<
  SettingsField['group'],
  { icon: typeof Store; titleAr: string; titleEn: string }
> = {
  store: { icon: Store, titleAr: 'بيانات المتجر', titleEn: 'Store details' },
  contact: { icon: Phone, titleAr: 'التواصل', titleEn: 'Contact' },
  payment: { icon: CreditCard, titleAr: 'الدفع والتقسيط', titleEn: 'Payment & installments' },
  about: { icon: Info, titleAr: 'حول المتجر', titleEn: 'About' },
};

const GROUP_ORDER: SettingsField['group'][] = ['store', 'contact', 'payment', 'about'];

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  store_name_ar: { ar: 'اسم المتجر (عربي)', en: 'Store name (Arabic)' },
  store_name_en: { ar: 'اسم المتجر (إنجليزي)', en: 'Store name (English)' },
  store_address: { ar: 'العنوان', en: 'Address' },
  cr_number: { ar: 'السجل التجاري', en: 'Commercial registration (CR)' },
  currency: { ar: 'العملة', en: 'Currency' },
  vat_percent: { ar: 'نسبة الضريبة %', en: 'VAT %' },
  default_months: { ar: 'أشهر التقسيط (مفصولة بفاصلة)', en: 'Installment months (comma-separated)' },
  min_down_payment_percent: { ar: 'الحد الأدنى للدفعة المقدمة %', en: 'Min down payment %' },
  benefit_payment_link: { ar: 'رابط دفع Benefit', en: 'Benefit payment link' },
  contract_terms_ar: { ar: 'شروط العقد (عربي)', en: 'Contract terms (Arabic)' },
  contract_terms_en: { ar: 'شروط العقد (إنجليزي)', en: 'Contract terms (English)' },
  store_phone: { ar: 'هاتف المتجر', en: 'Store phone' },
  whatsapp_number: { ar: 'رقم واتساب', en: 'WhatsApp number' },
  working_hours_ar: { ar: 'ساعات العمل (عربي)', en: 'Working hours (Arabic)' },
  working_hours_en: { ar: 'ساعات العمل (إنجليزي)', en: 'Working hours (English)' },
  about_ar: { ar: 'نبذة (عربي)', en: 'About (Arabic)' },
  about_en: { ar: 'نبذة (إنجليزي)', en: 'About (English)' },
};

export function SettingsPage() {
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const [settings, setSettings] = useState<AdminSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchSettings();
      setSettings(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      toasts.success(t('admin.success'));
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
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
      <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="max-w-md text-sm text-white/70" dir="ltr">{error}</p>
        <button onClick={load} className="btn-ghost mt-2">{t('admin.retry')}</button>
      </div>
    );
  }

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t('nav.settings')}</h1>
        <button onClick={onSave} disabled={saving} className="btn-gold px-4 py-2 text-xs">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{t('admin.save')}</span>
        </button>
      </div>

      {GROUP_ORDER.map((group) => {
        const meta = GROUP_META[group];
        const Icon = meta.icon;
        const fields = SETTINGS_FIELDS.filter((f) => f.group === group);
        return (
          <section key={group} className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/40">
              <Icon size={16} className="text-gold-300" />
              <span>{lang === 'ar' ? meta.titleAr : meta.titleEn}</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const label = FIELD_LABELS[f.key];
                return (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="label-field">{lang === 'ar' ? label.ar : label.en}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={settings[f.key] ?? ''}
                        onChange={(e) => setField(f.key, e.target.value)}
                        rows={5}
                        className="input-field"
                        dir={f.key.endsWith('_ar') ? 'rtl' : 'ltr'}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={settings[f.key] ?? ''}
                        onChange={(e) => setField(f.key, e.target.value)}
                        className="input-field"
                        dir={f.key.endsWith('_ar') || f.key === 'whatsapp_number' || f.key === 'store_phone' ? 'rtl' : 'ltr'}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="btn-gold px-4 py-2 text-xs">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{t('admin.save')}</span>
        </button>
      </div>
    </div>
  );
}
