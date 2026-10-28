import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, MessageCircle } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { formatCurrency } from '@/lib/format';
import { useSeo } from '@/components/Seo';

type ConfirmationData = {
  orderNumber: string;
  total: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
    lang: 'ar' | 'en';
  };
  items: {
    name: string;
    color: string;
    capacity: string;
    qty: number;
    price: number;
  }[];
  paymentType: 'full' | 'installment';
  months: number | null;
  downPayment: number;
};

export function ConfirmationPage() {
  const { orderNumber: paramOrder } = useParams();
  const location = useLocation();
  const { lang, t } = useLang();
  const { settings } = useSettings();

  const [data, setData] = useState<ConfirmationData | null>(null);

  useSeo({ title: t('confirm.title') });

  useEffect(() => {
    const fromState = (location.state as ConfirmationData | null) ?? null;
    if (fromState && fromState.orderNumber) {
      setData(fromState);
      return;
    }
    try {
      const raw = sessionStorage.getItem('kp_last_order');
      if (raw) {
        const parsed = JSON.parse(raw) as ConfirmationData;
        if (parsed.orderNumber) {
          setData(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [location.state]);

  if (!data) {
    return (
      <div className="container-page py-10">
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-sm text-white/60">{t('confirm.notFound')}</p>
          <Link to="/" className="btn-gold">
            {t('cta.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  const benefitLink = settings?.benefitPaymentLink ?? '';
  const waNumber = settings?.whatsappNumber?.replace(/\D/g, '') ?? '';
  const isInstallment = data.paymentType === 'installment';

  const buildWhatsAppMessage = (): string => {
    const lines: string[] = [];
    if (lang === 'ar') {
      lines.push(`طلب جديد — كنج للهواتف`);
      lines.push(`رقم الطلب: ${data.orderNumber}`);
      lines.push(`الاسم: ${data.customer.name}`);
      lines.push('');
      lines.push('المنتجات:');
      for (const item of data.items) {
        lines.push(`• ${item.name} — ${item.color} — ${item.capacity} × ${item.qty}`);
      }
      lines.push('');
      lines.push(`الإجمالي: ${formatCurrency(data.total, lang, settings?.currency)}`);
      if (isInstallment) {
        lines.push(`طريقة الدفع: تقسيط (${data.months} شهر)`);
        lines.push(`الدفعة المقدمة: ${formatCurrency(data.downPayment, lang, settings?.currency)}`);
      } else {
        lines.push(`طريقة الدفع: دفع كامل`);
      }
      if (data.customer.address) {
        lines.push(`عنوان التوصيل: ${data.customer.address}`);
      }
    } else {
      lines.push(`New order — King Phone`);
      lines.push(`Order number: ${data.orderNumber}`);
      lines.push(`Name: ${data.customer.name}`);
      lines.push('');
      lines.push('Products:');
      for (const item of data.items) {
        lines.push(`• ${item.name} — ${item.color} — ${item.capacity} × ${item.qty}`);
      }
      lines.push('');
      lines.push(`Total: ${formatCurrency(data.total, lang, settings?.currency)}`);
      if (isInstallment) {
        lines.push(`Payment: Installment (${data.months} months)`);
        lines.push(`Down payment: ${formatCurrency(data.downPayment, lang, settings?.currency)}`);
      } else {
        lines.push(`Payment: Full payment`);
      }
      if (data.customer.address) {
        lines.push(`Delivery address: ${data.customer.address}`);
      }
    }
    return encodeURIComponent(lines.join('\n'));
  };

  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${buildWhatsAppMessage()}`
    : '';

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        {/* Success header */}
        <div className="card mb-6 flex flex-col items-center gap-3 p-8 text-center animate-scale-in">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-400">
            <CheckCircle2 size={32} />
          </span>
          <h1 className="text-2xl font-bold text-white">{t('confirm.title')}</h1>
          <p className="text-sm text-white/60">{t('confirm.thanks')}</p>
          <div className="mt-2 rounded-xl bg-gold-300/10 px-6 py-3">
            <p className="text-xs text-white/50">{t('confirm.orderNumber')}</p>
            <p className="text-2xl font-bold text-gold-gradient">
              {data.orderNumber || paramOrder}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="card mb-6 space-y-3 p-5">
          <h2 className="text-sm font-semibold text-white">{t('confirm.summary')}</h2>
          <ul className="space-y-2">
            {data.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/70">
                  {item.name} — {item.color} — {item.capacity} × {item.qty}
                </span>
                <span className="font-medium text-white">
                  {formatCurrency(item.price * item.qty, lang, settings?.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t('checkout.total')}</span>
              <span className="text-lg font-bold text-gold-gradient">
                {formatCurrency(data.total, lang, settings?.currency)}
              </span>
            </div>
            {isInstallment && data.months && (
              <p className="mt-1 text-xs text-white/40">
                {t('checkout.months')}: {data.months} · {t('checkout.downPayment')}:{' '}
                {formatCurrency(data.downPayment, lang, settings?.currency)}
              </p>
            )}
          </div>
        </div>

        {/* Completion options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {benefitLink && (
            <a
              href={benefitLink}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex flex-col items-center gap-3 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/30 hover:shadow-gold"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-300/10 text-gold-300">
                <CreditCard size={24} />
              </span>
              <span className="text-sm font-semibold text-white">
                {isInstallment ? t('confirm.payBenefitInstallment') : t('confirm.payBenefit')}
              </span>
            </a>
          )}

          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex flex-col items-center gap-3 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/30 hover:shadow-gold"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-300/10 text-gold-300">
                <MessageCircle size={24} />
              </span>
              <span className="text-sm font-semibold text-white">
                {t('confirm.completeWhatsapp')}
              </span>
            </a>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-white/50">{t('confirm.note')}</p>

        <div className="mt-6 text-center">
          <Link to="/" className="btn-ghost">
            {t('cta.backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
