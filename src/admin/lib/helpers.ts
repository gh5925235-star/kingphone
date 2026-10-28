import type { Lang } from '@/lib/i18n';
import type { AdminOrderStatus, AdminPaymentMethod } from '@/admin/lib/types';

export const ORDER_STATUSES: AdminOrderStatus[] = ['pending', 'confirmed', 'paid', 'delivered', 'cancelled'];
export const PAYMENT_METHODS: AdminPaymentMethod[] = ['cash', 'benefit', 'bank_transfer', 'card', 'other'];

export function statusColor(status: AdminOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'border-gold-300/30 bg-gold-300/10 text-gold-200';
    case 'confirmed':
      return 'border-sky-400/30 bg-sky-500/10 text-sky-200';
    case 'paid':
      return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
    case 'delivered':
      return 'border-violet-400/30 bg-violet-500/10 text-violet-200';
    case 'cancelled':
      return 'border-red-400/30 bg-red-500/10 text-red-200';
    default:
      return 'border-white/15 bg-white/5 text-white/70';
  }
}

export function paymentBadgeClass(type: 'full' | 'installment'): string {
  return type === 'installment'
    ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
    : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
}

export function formatCurrency3(amount: number | null | undefined, lang: Lang, currency = 'BHD'): string {
  const n = Number(amount || 0);
  const fixed = n.toFixed(3);
  if (lang === 'ar') return `${fixed} د.ب`;
  return `${currency} ${fixed}`;
}

export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-BH' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-BH' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }
}

// WhatsApp link with country code handling. If the number is 8 digits (Bahrain local), prepend 973.
export function whatsappLink(phone: string | null | undefined, text?: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 8) digits = '973' + digits;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
