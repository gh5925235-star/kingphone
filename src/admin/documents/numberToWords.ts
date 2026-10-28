import type { Lang } from '@/lib/i18n';

// Number to words for Bahraini Dinar (BHD) and fils. Supports 3 decimals.
// English and Arabic implementations. Handles integer + fractional (fils) parts.

const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const AR_ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const AR_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

const EN_GROUPS = ['', 'thousand', 'million', 'billion'];
const AR_GROUPS = ['', 'ألف', 'مليون', 'مليار'];

function threeDigitsEn(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) parts.push(`${EN_ONES[h]} hundred`);
  if (rem > 0) {
    if (rem < 20) parts.push(EN_ONES[rem]);
    else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      parts.push(o ? `${EN_TENS[t]}-${EN_ONES[o]}` : EN_TENS[t]);
    }
  }
  return parts.join(' ');
}

function threeDigitsAr(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) {
    if (h === 1) parts.push('مئة');
    else if (h === 2) parts.push('مئتان');
    else parts.push(`${AR_ONES[h]} مئة`);
  }
  if (rem > 0) {
    if (rem < 20) parts.push(AR_ONES[rem]);
    else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (o) parts.push(`${AR_ONES[o]} و${AR_TENS[t]}`);
      else parts.push(AR_TENS[t]);
    }
  }
  return parts.join(' و');
}

function intToWordsEn(n: number): string {
  if (n === 0) return 'zero';
  const groups: number[] = [];
  let v = n;
  while (v > 0) {
    groups.push(v % 1000);
    v = Math.floor(v / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const w = threeDigitsEn(g);
    const grp = EN_GROUPS[i];
    parts.push(grp ? `${w} ${grp}` : w);
  }
  return parts.join(' ');
}

function intToWordsAr(n: number): string {
  if (n === 0) return 'صفر';
  const groups: number[] = [];
  let v = n;
  while (v > 0) {
    groups.push(v % 1000);
    v = Math.floor(v / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const w = threeDigitsAr(g);
    const grp = AR_GROUPS[i];
    if (grp) {
      if (i === 1 && g === 1) parts.push('ألف');
      else if (i === 1 && g === 2) parts.push('ألفان');
      else if (i === 1 && g >= 3 && g <= 10) parts.push(`${w} آلاف`);
      else parts.push(`${w} ${grp}`);
    } else {
      parts.push(w);
    }
  }
  return parts.join(' و');
}

export function amountToWords(amount: number, lang: Lang, currency = 'BHD'): string {
  const n = Math.abs(Number(amount || 0));
  const dinars = Math.floor(n);
  // round fils to integer (3 decimals)
  const fils = Math.round((n - dinars) * 1000);
  if (lang === 'ar') {
    const dPart = dinars > 0 ? `${intToWordsAr(dinars)} دينار` : '';
    const fPart = fils > 0 ? `${intToWordsAr(fils)} فلس` : '';
    const joined = [dPart, fPart].filter(Boolean).join(' و');
    return joined || 'صفر دينار';
  }
  const dPart = dinars > 0 ? `${intToWordsEn(dinars)} dinars` : '';
  const fPart = fils > 0 ? `${intToWordsEn(fils)} fils` : '';
  const joined = [dPart, fPart].filter(Boolean).join(' and ');
  return joined || 'zero dinars';
}
