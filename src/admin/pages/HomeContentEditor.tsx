import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save, Loader2, UploadCloud, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchCategories } from '@/admin/lib/ordersApi';
import type { AdminCategory } from '@/admin/lib/types';
import { fetchHomeContent, saveHomeContent, uploadHomeMedia } from '@/lib/homeContentApi';
import {
  HOME_CONTENT,
  type HomeContentData,
  type L,
  type Offer,
  type OfferTheme,
  type Showcase,
  type Slide,
  type SlidePrice,
} from '@/config/homeContent';

const THEME_OPTIONS: [OfferTheme, string][] = [
  ['light', 'فاتح'],
  ['red', 'أحمر'],
  ['navy', 'كحلي'],
  ['orange', 'برتقالي'],
];
const ICON_OPTIONS: [Showcase['icon'], string][] = [
  ['phone', 'موبايل'],
  ['audio', 'سماعات'],
  ['watch', 'ساعة'],
  ['laptop', 'لابتوب'],
];

const emptyL = (): L => ({ ar: '', en: '' });
const newSlide = (): Slide => ({
  title: emptyL(),
  cta: { ar: 'اشترِ الآن', en: 'Buy now' },
  link: '/',
  theme: 'light',
  prices: [],
});
const newOffer = (): Offer => ({
  badge: emptyL(),
  title: emptyL(),
  subtitle: emptyL(),
  cta: { ar: 'تسوّق الآن', en: 'Shop now' },
  link: '/',
  theme: 'red',
});
const newShowcase = (): Showcase => ({
  icon: 'phone',
  title: emptyL(),
  subtitle: emptyL(),
  cta: { ar: 'تسوّق الآن', en: 'Shop now' },
  link: '/',
  video: '',
  poster: '',
});

function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ------------------------------ حقول عامة ------------------------------ */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {hint && <p className="mt-1 text-[11px] leading-relaxed text-white/40">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
  dir,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        dir={dir}
        placeholder={placeholder}
      />
    </div>
  );
}

function LText({ label, value, onChange }: { label: string; value: L | undefined; onChange: (v: L) => void }) {
  const v = value ?? emptyL();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Text label={`${label} (عربي)`} value={v.ar} onChange={(ar) => onChange({ ...v, ar })} dir="rtl" />
      <Text label={`${label} (English)`} value={v.en} onChange={(en) => onChange({ ...v, en })} dir="ltr" />
    </div>
  );
}

function ThemeSelect({ value, onChange }: { value: OfferTheme; onChange: (v: OfferTheme) => void }) {
  return (
    <div>
      <label className="label-field">اللون</label>
      <select value={value} onChange={(e) => onChange(e.target.value as OfferTheme)} className="input-field">
        {THEME_OPTIONS.map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Media({
  label,
  value,
  onChange,
  kind,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  kind: 'image' | 'video';
}) {
  const toasts = useToasts();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (f: File | undefined) => {
    if (!f) return;
    if (kind === 'video' && f.size > 30 * 1024 * 1024) {
      toasts.error('الفيديو أكبر من 30MB. صغّره الأول.');
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadHomeMedia(f, kind));
      toasts.success('تم الرفع. لا تنسى تدوس حفظ.');
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-tint-100">
          {value ? (
            kind === 'video' ? (
              <video src={value} muted className="h-full w-full object-cover" />
            ) : (
              <img src={value} alt="" className="h-full w-full object-contain" />
            )
          ) : (
            <span className="text-[10px] text-white/30">{kind === 'video' ? 'فيديو' : 'صورة'}</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="input-field"
            dir="ltr"
            placeholder="https://… أو ارفع ملف"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn-ghost px-3 py-1.5 text-xs">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              <span>{kind === 'video' ? 'رفع فيديو' : 'رفع صورة'}</span>
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="btn-ghost px-3 py-1.5 text-xs">
                <X size={14} />
                <span>مسح</span>
              </button>
            )}
          </div>
          <input
            ref={ref}
            type="file"
            accept={kind === 'video' ? 'video/mp4,video/webm' : 'image/*'}
            className="hidden"
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}

function RowTools({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded p-1.5 text-white/50 hover:bg-white/5 disabled:opacity-20">
        <ArrowUp size={14} />
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded p-1.5 text-white/50 hover:bg-white/5 disabled:opacity-20">
        <ArrowDown size={14} />
      </button>
      <button type="button" onClick={onRemove} className="rounded p-1.5 text-red-400 hover:bg-red-500/10">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ------------------------------ المحرر ------------------------------ */

export function HomeContentEditor() {
  const { dir } = useAdminLang();
  const toasts = useToasts();
  const [c, setC] = useState<HomeContentData | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHomeContent().then(setC);
    fetchCategories().then(setCats).catch(() => { /* ignore */ });
  }, []);

  if (!c) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-white/50">
        <Loader2 size={20} className="animate-spin text-gold-300" />
      </div>
    );
  }

  const set = (patch: Partial<HomeContentData>) => setC({ ...c, ...patch });

  const save = async () => {
    setSaving(true);
    try {
      await saveHomeContent(c);
      toasts.success('تم حفظ محتوى الصفحة الرئيسية');
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const updSlide = (i: number, patch: Partial<Slide>) =>
    set({ slides: c.slides.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const updOffer = (i: number, patch: Partial<Offer>) =>
    set({ offers: c.offers.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const updShow = (i: number, patch: Partial<Showcase>) =>
    set({ showcases: c.showcases.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  return (
    <div dir={dir} className="space-y-6">
      <div className="sticky top-0 z-20 -mx-1 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/95 p-3 backdrop-blur">
        <p className="text-xs text-white/50">أي تعديل مش بيظهر في المتجر إلا بعد الحفظ</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setC(HOME_CONTENT)}
            className="btn-ghost px-3 py-2 text-xs"
            title="يرجّع الأصلي (ومش بيتحفظ إلا لما تدوس حفظ)"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">الافتراضي</span>
          </button>
          <button type="button" onClick={save} disabled={saving} className="btn-gold px-4 py-2 text-xs">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>حفظ</span>
          </button>
        </div>
      </div>

      <Section title="الشريط العلوي">
        <LText label="النص" value={c.topBar} onChange={(topBar) => set({ topBar })} />
      </Section>

      {/* الشرائح */}
      <Section
        title="البانر المتحرك (الشرائح)"
        hint="الشريحة الأولى دايماً هي اللوجو. الشرائح دي بتيجي بعدها. السعر القديم بيتشطب لو كتبته."
      >
        {c.slides.map((s, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/10 bg-ink-950 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">شريحة {i + 1}</span>
              <RowTools
                index={i}
                total={c.slides.length}
                onMove={(d) => set({ slides: move(c.slides, i, d) })}
                onRemove={() => set({ slides: c.slides.filter((_, k) => k !== i) })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Text label="الماركة (مثال: APPLE)" value={s.brand} onChange={(brand) => updSlide(i, { brand })} dir="ltr" />
              <ThemeSelect value={s.theme} onChange={(theme) => updSlide(i, { theme })} />
            </div>
            <LText label="الشارة (مثال: عرض لفترة محدودة)" value={s.badge} onChange={(badge) => updSlide(i, { badge })} />
            <LText label="العنوان" value={s.title} onChange={(title) => updSlide(i, { title })} />
            <LText label="سطر توضيحي" value={s.subtitle} onChange={(subtitle) => updSlide(i, { subtitle })} />

            <div className="space-y-2">
              <label className="label-field">الأسعار</label>
              {(s.prices ?? []).map((p: SlidePrice, k: number) => (
                <div key={k} className="grid grid-cols-2 gap-2 rounded-lg border border-white/5 p-2 sm:grid-cols-5">
                  <Text
                    label="وصف (عربي)"
                    value={p.label?.ar}
                    onChange={(ar) => {
                      const prices = [...(s.prices ?? [])];
                      prices[k] = { ...p, label: { ar, en: p.label?.en ?? '' } };
                      updSlide(i, { prices });
                    }}
                    dir="rtl"
                    placeholder="256 جيجا"
                  />
                  <Text
                    label="Label (EN)"
                    value={p.label?.en}
                    onChange={(en) => {
                      const prices = [...(s.prices ?? [])];
                      prices[k] = { ...p, label: { ar: p.label?.ar ?? '', en } };
                      updSlide(i, { prices });
                    }}
                    dir="ltr"
                    placeholder="256GB"
                  />
                  <Text
                    label="السعر القديم"
                    value={p.old}
                    onChange={(old) => {
                      const prices = [...(s.prices ?? [])];
                      prices[k] = { ...p, old };
                      updSlide(i, { prices });
                    }}
                    dir="ltr"
                    placeholder="600 د.ب"
                  />
                  <Text
                    label="السعر الحالي"
                    value={p.now}
                    onChange={(now) => {
                      const prices = [...(s.prices ?? [])];
                      prices[k] = { ...p, now };
                      updSlide(i, { prices });
                    }}
                    dir="ltr"
                    placeholder="560 د.ب"
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => updSlide(i, { prices: (s.prices ?? []).filter((_, q) => q !== k) })}
                      className="btn-ghost px-3 py-2 text-xs text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updSlide(i, { prices: [...(s.prices ?? []), { now: '' }] })}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                <Plus size={14} />
                <span>إضافة سعر</span>
              </button>
            </div>

            <LText label="سطر صغير تحت (مثال: العرض ساري حتى ...)" value={s.note} onChange={(note) => updSlide(i, { note })} />
            <LText label="نص الزرار" value={s.cta} onChange={(cta) => updSlide(i, { cta })} />
            <Text label="الرابط (مثال: /p/iphone-18-pro-max أو /c/iphone)" value={s.link} onChange={(link) => updSlide(i, { link })} dir="ltr" />
            <Media label="صورة الجهاز (PNG شفاف أحسن)" value={s.image} onChange={(image) => updSlide(i, { image })} kind="image" />
          </div>
        ))}
        <button type="button" onClick={() => set({ slides: [...c.slides, newSlide()] })} className="btn-ghost px-3 py-2 text-xs">
          <Plus size={14} />
          <span>إضافة شريحة</span>
        </button>
      </Section>

      {/* البانر العريض */}
      <Section title="البانر العريض (تحت السلايدر)">
        <LText label="الشارة" value={c.strip.badge} onChange={(badge) => set({ strip: { ...c.strip, badge } })} />
        <LText label="العنوان" value={c.strip.title} onChange={(title) => set({ strip: { ...c.strip, title } })} />
        <LText label="سطر توضيحي" value={c.strip.subtitle} onChange={(subtitle) => set({ strip: { ...c.strip, subtitle } })} />
        <LText label="نص الزرار" value={c.strip.cta} onChange={(cta) => set({ strip: { ...c.strip, cta } })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Text label="الرابط" value={c.strip.link} onChange={(link) => set({ strip: { ...c.strip, link } })} dir="ltr" />
          <ThemeSelect value={c.strip.theme} onChange={(theme) => set({ strip: { ...c.strip, theme } })} />
        </div>
        <Media label="صورة (اختياري)" value={c.strip.image} onChange={(image) => set({ strip: { ...c.strip, image } })} kind="image" />
      </Section>

      {/* كروت الخصم */}
      <Section
        title="كروت الخصومات (أفضل فئات التوفير)"
        hint="كارت لكل قسم. اكتب نسبة الخصم (مثال: حتى 10%) وارفع صورة للكارت. لو سبتهم فاضيين بيظهر اسم القسم وأيقونة."
      >
        {cats.length === 0 && <p className="text-sm text-white/40">مفيش أقسام لسه.</p>}
        {cats.map((cat) => {
          const sv = c.savings[cat.slug] ?? {};
          const upd = (patch: Partial<typeof sv>) => set({ savings: { ...c.savings, [cat.slug]: { ...sv, ...patch } } });
          return (
            <div key={cat.id} className="space-y-3 rounded-xl border border-white/10 bg-ink-950 p-4">
              <span className="text-sm font-semibold text-white">{cat.name_ar}</span>
              <LText label="نص الخصم" value={sv.discount} onChange={(discount) => upd({ discount })} />
              <Media label="صورة الكارت" value={sv.image} onChange={(image) => upd({ image })} kind="image" />
            </div>
          );
        })}
      </Section>

      {/* كروت العروض */}
      <Section title="كروت العروض">
        {c.offers.map((o, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/10 bg-ink-950 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">كارت {i + 1}</span>
              <RowTools
                index={i}
                total={c.offers.length}
                onMove={(d) => set({ offers: move(c.offers, i, d) })}
                onRemove={() => set({ offers: c.offers.filter((_, k) => k !== i) })}
              />
            </div>
            <LText label="الشارة" value={o.badge} onChange={(badge) => updOffer(i, { badge })} />
            <LText label="العنوان" value={o.title} onChange={(title) => updOffer(i, { title })} />
            <LText label="سطر توضيحي" value={o.subtitle} onChange={(subtitle) => updOffer(i, { subtitle })} />
            <LText label="نص الزرار" value={o.cta} onChange={(cta) => updOffer(i, { cta })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Text label="الرابط" value={o.link} onChange={(link) => updOffer(i, { link })} dir="ltr" />
              <ThemeSelect value={o.theme} onChange={(theme) => updOffer(i, { theme })} />
            </div>
            <Media label="صورة (اختياري)" value={o.image} onChange={(image) => updOffer(i, { image })} kind="image" />
          </div>
        ))}
        <button type="button" onClick={() => set({ offers: [...c.offers, newOffer()] })} className="btn-ghost px-3 py-2 text-xs">
          <Plus size={14} />
          <span>إضافة كارت</span>
        </button>
      </Section>

      {/* الفيديوهات */}
      <Section
        title="أماكن الفيديو (شاهد وتعرّف)"
        hint="ارفع ملف mp4 (أقل من 30MB، ويفضل 10-15 ثانية). بيشتغل تلقائي بدون صوت. لو مفيش فيديو بيظهر تصميم بأيقونة."
      >
        {c.showcases.map((s, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-white/10 bg-ink-950 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">مكان {i + 1}</span>
              <RowTools
                index={i}
                total={c.showcases.length}
                onMove={(d) => set({ showcases: move(c.showcases, i, d) })}
                onRemove={() => set({ showcases: c.showcases.filter((_, k) => k !== i) })}
              />
            </div>
            <LText label="العنوان" value={s.title} onChange={(title) => updShow(i, { title })} />
            <LText label="سطر توضيحي" value={s.subtitle} onChange={(subtitle) => updShow(i, { subtitle })} />
            <LText label="نص الزرار" value={s.cta} onChange={(cta) => updShow(i, { cta })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Text label="الرابط" value={s.link} onChange={(link) => updShow(i, { link })} dir="ltr" />
              <div>
                <label className="label-field">الأيقونة (لو مفيش فيديو)</label>
                <select value={s.icon} onChange={(e) => updShow(i, { icon: e.target.value as Showcase['icon'] })} className="input-field">
                  {ICON_OPTIONS.map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Media label="الفيديو (mp4)" value={s.video} onChange={(video) => updShow(i, { video })} kind="video" />
            <Media label="صورة تظهر قبل الفيديو (اختياري)" value={s.poster} onChange={(poster) => updShow(i, { poster })} kind="image" />
          </div>
        ))}
        <button type="button" onClick={() => set({ showcases: [...c.showcases, newShowcase()] })} className="btn-ghost px-3 py-2 text-xs">
          <Plus size={14} />
          <span>إضافة مكان فيديو</span>
        </button>
      </Section>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="btn-gold px-5 py-2.5 text-xs">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>حفظ</span>
        </button>
      </div>
    </div>
  );
}
