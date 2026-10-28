import type { Lang } from '@/lib/i18n';

export function formatCurrency(amount: number, lang: Lang, currency = 'BHD'): string {
  const n = Number(amount || 0);
  const fixed = n.toFixed(3);
  if (lang === 'ar') {
    return `${fixed} د.ب`;
  }
  return `${currency} ${fixed}`;
}

export function formatNumber(n: number, lang: Lang): string {
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-BH' : 'en-US').format(n);
  } catch {
    return String(n);
  }
}

export function parseDefaultMonths(value: string | undefined): number[] {
  if (!value) return [3, 6, 9, 12];
  const arr = value
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return arr.length ? arr : [3, 6, 9, 12];
}
