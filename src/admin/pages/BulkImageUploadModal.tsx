import { useCallback, useMemo, useRef, useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import type { AdminProduct, AdminVariant } from '@/admin/lib/types';
import { Modal } from '@/admin/components/ui';

type VariantWithSlug = AdminVariant & { slug?: string };

type MatchTarget =
  | { kind: 'product'; productId: string; variantId?: undefined }
  | { kind: 'variant'; productId: string; variantId: string; variantIds: string[] }
  | { kind: 'skip' };

type FileRow = {
  id: string;
  file: File;
  preview: string;
  target: MatchTarget;
  matchedLabel: string | null;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'skipped';
};

const ACCEPTED = /\.(png|jpe?g|webp)$/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}

function colorNormalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}


// ---------------------------------------------------------------------------
// توحيد الصور تلقائياً قبل الرفع (من غير ما ناكل أي حاجة من الجهاز):
// 1) نكتشف لون الخلفية من حواف الصورة
// 2) نحوّل الخلفية لأبيض نقي (بدون مسح أي بكسل، فالجهاز الفضي/الأبيض سليم)
// 3) نقص على حدود الجهاز ونحطه في مربع 1000x1000 بهامش ثابت
// والموقع بيعرض الصور بـ mix-blend-multiply، فالأبيض بيختفي على أي خلفية فاتحة.
// لو الصورة أصلاً شفافة (PNG) بنسيبها شفافة.
// ---------------------------------------------------------------------------
const OUT_SIZE = 1000; // مقاس الصورة النهائية (بكسل)
const OUT_PADDING = 0.08; // الهامش حوالين الجهاز (8%)

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

type Bg = { r: number; g: number; b: number };

// بيرجع: هل الصورة شفافة أصلاً؟ ولون الخلفية لو كانت موحدة وفاتحة
function analyzeBorder(d: Uint8ClampedArray, w: number, h: number): { hasAlpha: boolean; bg: Bg | null } {
  const step = Math.max(1, Math.floor(Math.min(w, h) / 60));
  const idx: number[] = [];
  for (let x = 0; x < w; x += step) {
    idx.push(x);
    idx.push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y += step) {
    idx.push(y * w);
    idx.push(y * w + (w - 1));
  }
  let transparent = 0;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (const p of idx) {
    const i = p * 4;
    if (d[i + 3] < 200) {
      transparent++;
      continue;
    }
    rs.push(d[i]);
    gs.push(d[i + 1]);
    bs.push(d[i + 2]);
  }
  if (rs.length === 0 || transparent / idx.length > 0.05) return { hasAlpha: true, bg: null };

  const bg: Bg = { r: median(rs), g: median(gs), b: median(bs) };
  const light = Math.min(bg.r, bg.g, bg.b) >= 190;
  let close = 0;
  for (let k = 0; k < rs.length; k++) {
    const dr = rs[k] - bg.r;
    const dg = gs[k] - bg.g;
    const db = bs[k] - bg.b;
    if (Math.sqrt(dr * dr + dg * dg + db * db) < 40) close++;
  }
  const uniform = close / rs.length >= 0.85;
  return { hasAlpha: false, bg: light && uniform ? bg : null };
}

async function normalizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const shrink = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * shrink));
  const h = Math.max(1, Math.round(bitmap.height * shrink));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wctx = work.getContext('2d', { willReadFrequently: true })!;
  wctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const imgData = wctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const { hasAlpha, bg } = analyzeBorder(d, w, h);

  if (bg) {
    // نقسم كل قناة على لون الخلفية، فالخلفية بتبقى أبيض والجهاز يفضل زي ما هو
    const kr = 255 / Math.max(bg.r, 1);
    const kg = 255 / Math.max(bg.g, 1);
    const kb = 255 / Math.max(bg.b, 1);
    for (let i = 0; i < d.length; i += 4) {
      const r = Math.min(255, d[i] * kr);
      const g = Math.min(255, d[i + 1] * kg);
      const b = Math.min(255, d[i + 2] * kb);
      if (r >= 247 && g >= 247 && b >= 247) {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
      } else {
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
    }
    wctx.putImageData(imgData, 0, 0);
  }

  // حدود الجهاز
  const isContent = (i: number) =>
    hasAlpha ? d[i + 3] > 20 : d[i] < 236 || d[i + 1] < 236 || d[i + 2] < 236;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isContent((y * w + x) * 4)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const out = document.createElement('canvas');
  out.width = OUT_SIZE;
  out.height = OUT_SIZE;
  const octx = out.getContext('2d')!;
  if (!hasAlpha) {
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
  }
  octx.imageSmoothingQuality = 'high';
  const inner = OUT_SIZE * (1 - OUT_PADDING * 2);
  const k = Math.min(inner / cw, inner / ch);
  const dw = cw * k;
  const dh = ch * k;
  octx.drawImage(work, minX, minY, cw, ch, (OUT_SIZE - dw) / 2, (OUT_SIZE - dh) / 2, dw, dh);

  return new Promise((resolve, reject) => {
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/webp', 0.92);
  });
}

export function BulkImageUploadModal({
  products,
  variants,
  onClose,
  onDone,
}: {
  products: AdminProduct[];
  variants: VariantWithSlug[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { dir, t } = useAdminLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<FileRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<'review' | 'uploading' | 'done'>('review');
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{ ok: number; skipped: number; failed: number }>({ ok: 0, skipped: 0, failed: 0 });

  const slugMap = useMemo(() => {
    const m = new Map<string, AdminProduct>();
    for (const p of products) m.set(p.slug.toLowerCase(), p);
    return m;
  }, [products]);

  const normNameMap = useMemo(() => {
    const m = new Map<string, AdminProduct>();
    for (const p of products) m.set(normalize(p.name_en), p);
    return m;
  }, [products]);

  // Map: productSlug -> colorEn(normalized) -> كل الـ variants بنفس اللون (كل السعات)
  const variantColorMap = useMemo(() => {
    const m = new Map<string, Map<string, VariantWithSlug[]>>();
    for (const v of variants) {
      const slug = (v.slug ?? '').toLowerCase();
      if (!slug) continue;
      if (!m.has(slug)) m.set(slug, new Map());
      const colorMap = m.get(slug)!;
      const key = colorNormalize(v.color_en);
      if (!colorMap.has(key)) colorMap.set(key, []);
      colorMap.get(key)!.push(v);
    }
    return m;
  }, [variants]);

  const matchFile = useCallback(
    (file: File): { target: MatchTarget; label: string | null } => {
      const base = file.name.replace(/\.[^.]+$/, '');
      const lower = base.toLowerCase();

      // Try color variant match: {slug}-{color}
      // Find the longest product slug that is a prefix of the base name.
      let bestProduct: AdminProduct | null = null;
      let bestColor: string | null = null;
      let bestVariants: VariantWithSlug[] | null = null;
      for (const p of products) {
        const slug = p.slug.toLowerCase();
        if (lower === slug) continue; // exact product, not a variant
        if (lower.startsWith(slug + '-')) {
          const rest = base.slice(slug.length + 1);
          const colorMap = variantColorMap.get(slug);
          if (colorMap) {
            for (const [cnorm, vs] of colorMap) {
              if (cnorm === colorNormalize(rest)) {
                if (!bestProduct || slug.length > bestProduct.slug.length) {
                  bestProduct = p;
                  bestColor = vs[0].color_en;
                  bestVariants = vs;
                }
              }
            }
          }
        }
      }
      if (bestProduct && bestVariants) {
        const vs: VariantWithSlug[] = bestVariants;
        return {
          target: {
            kind: 'variant',
            productId: bestProduct.id,
            variantId: vs[0].id,
            variantIds: vs.map((x) => x.id),
          },
          label: `${bestProduct.name_en} · ${bestColor}${vs.length > 1 ? ` (×${vs.length})` : ''}`,
        };
      }

      // Exact slug match
      const bySlug = slugMap.get(lower);
      if (bySlug) {
        return { target: { kind: 'product', productId: bySlug.id }, label: bySlug.name_en };
      }

      // Tolerant name match
      const byName = normNameMap.get(normalize(base));
      if (byName) {
        return { target: { kind: 'product', productId: byName.id }, label: byName.name_en };
      }

      return { target: { kind: 'skip' }, label: null };
    },
    [products, slugMap, normNameMap, variantColorMap],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList).filter((f) => ACCEPTED.test(f.name));
      const newRows: FileRow[] = incoming.map((file) => {
        const { target, label } = matchFile(file);
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file),
          target,
          matchedLabel: label,
          status: 'pending',
        };
      });
      setRows((prev) => [...prev, ...newRows]);
    },
    [matchFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const setRowTarget = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (value === 'skip') {
          return { ...r, target: { kind: 'skip' }, matchedLabel: null };
        }
        if (value.startsWith('p:')) {
          const productId = value.slice(2);
          const p = products.find((pp) => pp.id === productId);
          return { ...r, target: { kind: 'product', productId }, matchedLabel: p?.name_en ?? null };
        }
        if (value.startsWith('v:')) {
          const variantId = value.slice(2);
          const v = variants.find((vv) => vv.id === variantId);
          const p = products.find((pp) => pp.id === v?.product_id);
          const siblings = v
            ? variants.filter(
                (x) => x.product_id === v.product_id && colorNormalize(x.color_en) === colorNormalize(v.color_en),
              )
            : [];
          return {
            ...r,
            target: {
              kind: 'variant',
              productId: v!.product_id,
              variantId,
              variantIds: siblings.length ? siblings.map((x) => x.id) : [variantId],
            },
            matchedLabel: v ? `${p?.name_en ?? ''} · ${v.color_en}${siblings.length > 1 ? ` (×${siblings.length})` : ''}` : null,
          };
        }
        return r;
      }),
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (row) URL.revokeObjectURL(row.preview);
      return prev.filter((r) => r.id !== id);
    });
  };

  const uploadable = rows.filter((r) => r.target.kind !== 'skip');

  const onConfirm = async () => {
    const toUpload = rows.filter((r) => r.target.kind !== 'skip');
    if (toUpload.length === 0) return;
    setPhase('uploading');
    setProgress(0);
    let ok = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const row = toUpload[i];
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'uploading' } : r)));
      try {
        // توحيد الصورة (حجم + هامش + خلفية بيضا). لو فشل نرفع الأصلية.
        let uploadBlob: Blob = row.file;
        let ext = row.file.name.split('.').pop()?.toLowerCase() ?? 'png';
        let mime = row.file.type;
        try {
          uploadBlob = await normalizeImage(row.file);
          ext = 'webp';
          mime = 'image/webp';
        } catch {
          /* نكمل بالصورة الأصلية */
        }
        const storagePath =
          row.target.kind === 'variant'
            ? `${row.target.productId}/${row.target.variantId}.${ext}`
            : `${row.target.productId}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('products')
          .upload(storagePath, uploadBlob, { upsert: true, contentType: mime });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('products').getPublicUrl(storagePath);
        const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

        if (row.target.kind === 'variant') {
          const { error: vErr } = await supabase
            .from('product_variants')
            .update({ image_url: publicUrl })
            .in('id', row.target.variantIds);
          if (vErr) throw vErr;
        } else {
          const { error: pErr } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', row.target.productId);
          if (pErr) throw pErr;
        }

        ok++;
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'done' } : r)));
      } catch {
        failed++;
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'error' } : r)));
      }
      setProgress(Math.round(((i + 1) / toUpload.length) * 100));
    }

    skipped = rows.length - toUpload.length;
    setSummary({ ok, skipped, failed });
    setPhase('done');
    if (ok > 0) onDone();
  };

  const canConfirm = uploadable.length > 0 && phase === 'review';

  return (
    <Modal
      open
      title={t('bulk.title')}
      onClose={onClose}
      footer={
        phase === 'review' ? (
          <>
            <button onClick={onClose} className="btn-ghost px-4 py-2 text-xs">
              {t('admin.cancel')}
            </button>
            <button onClick={onConfirm} disabled={!canConfirm} className="btn-gold px-4 py-2 text-xs">
              <UploadCloud size={14} />
              <span>{t('bulk.confirm', { count: uploadable.length })}</span>
            </button>
          </>
        ) : phase === 'done' ? (
          <button onClick={onClose} className="btn-gold px-4 py-2 text-xs">
            {t('bulk.close')}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4" dir={dir}>
        <p className="text-xs text-white/50">{t('bulk.hint')}</p>

        {phase === 'review' && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragging ? 'border-gold-300/60 bg-gold-300/5' : 'border-white/15 hover:border-white/25'
              }`}
            >
              <UploadCloud size={28} className="text-gold-300/60" />
              <span className="text-sm text-white/60">{t('bulk.drop')}</span>
              <span className="text-xs text-gold-200">{t('bulk.browse')}</span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {rows.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/40">{t('bulk.noFiles')}</p>
            ) : (
              <div className="max-h-[40vh] overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-ink-800 text-white/40">
                    <tr className="border-b border-white/5">
                      <th className="px-2 py-2 text-start font-medium">{t('bulk.col.file')}</th>
                      <th className="px-2 py-2 text-start font-medium">{t('bulk.col.matched')}</th>
                      <th className="px-2 py-2 text-end font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const unmatched = r.target.kind === 'skip' && r.matchedLabel === null;
                      return (
                        <tr key={r.id} className={`border-b border-white/5 ${unmatched ? 'bg-red-500/5' : ''}`}>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <img src={r.preview} alt="" className="h-10 w-10 rounded object-cover" />
                              <span className="max-w-[140px] truncate text-xs text-white/70" dir="ltr">
                                {r.file.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={
                                r.target.kind === 'skip'
                                  ? 'skip'
                                  : r.target.kind === 'variant'
                                    ? `v:${r.target.variantId}`
                                    : `p:${r.target.productId}`
                              }
                              onChange={(e) => setRowTarget(r.id, e.target.value)}
                              className="input-field text-xs"
                            >
                              <option value="skip">
                                {unmatched ? t('bulk.unmatched') : t('bulk.skip')}
                              </option>
                              {products.map((p) => (
                                <optgroup key={p.id} label={p.name_en}>
                                  <option value={`p:${p.id}`}>{t('bulk.productImage')}</option>
                                  {variants
                                    .filter((v) => v.product_id === p.id)
                                    .filter(
                                      (v, i, arr) =>
                                        arr.findIndex((x) => colorNormalize(x.color_en) === colorNormalize(v.color_en)) === i,
                                    )
                                    .map((v) => (
                                      <option key={v.id} value={`v:${v.id}`}>
                                        {t('bulk.variantColor', { color: v.color_en })}
                                      </option>
                                    ))}
                                </optgroup>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 text-end">
                            <button
                              onClick={() => removeRow(r.id)}
                              className="rounded-lg border border-white/10 p-1 text-white/40 hover:text-red-300"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {phase === 'uploading' && (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center gap-3 text-white/60">
              <Loader2 size={20} className="animate-spin text-gold-300" />
              <span className="text-sm">{t('bulk.uploading')}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold-300 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-white/40">{progress}%</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm text-white/70">
                {t('bulk.summary', {
                  ok: summary.ok,
                  skipped: summary.skipped,
                  failed: summary.failed,
                })}
              </p>
            </div>
            <div className="max-h-[30vh] overflow-y-auto scrollbar-thin">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 border-b border-white/5 px-2 py-1.5 text-xs"
                >
                  <img src={r.preview} alt="" className="h-8 w-8 rounded object-cover" />
                  <span className="max-w-[160px] truncate text-white/60" dir="ltr">
                    {r.file.name}
                  </span>
                  <span className="ms-auto">
                    {r.status === 'done' && <CheckCircle2 size={14} className="text-emerald-400" />}
                    {r.status === 'error' && <X size={14} className="text-red-400" />}
                    {r.status === 'skipped' && <ImageIcon size={14} className="text-white/30" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
