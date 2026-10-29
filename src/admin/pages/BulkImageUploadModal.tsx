import { useCallback, useMemo, useRef, useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, X, ImageIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import type { AdminProduct, AdminVariant } from '@/admin/lib/types';
import { Modal } from '@/admin/components/ui';

type MatchTarget =
  | { kind: 'product'; productId: string; variantId?: undefined }
  | { kind: 'variant'; productId: string; variantId: string }
  | { kind: 'skip' };

type FileRow = {
  id: string;
  file: File;
  preview: string;
  target: MatchTarget;
  matchedLabel: string | null;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'skipped';
  errorMsg?: string;
};

const ACCEPTED = /\.(png|jpe?g|webp)$/i;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}

function colorNormalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}

// ---------------------------------------------------------------------------
// Image normalization: remove uniform background, crop to product, pad to
// 1000x1000 on transparent canvas, output as WebP.
// ---------------------------------------------------------------------------
const OUT_SIZE = 1000;
const OUT_PADDING = 0.08;
const BG_TOLERANCE = 12; // was 38: too loose, leaked into light/silver products
const BG_STEP = 5; // max color jump between neighbouring pixels while flooding
const MAX_REMOVED = 0.7; // if more than 70% would be removed, assume it ate the product

function colorDist(d: Uint8ClampedArray, i: number, r: number, g: number, b: number): number {
  const dr = d[i] - r;
  const dg = d[i + 1] - g;
  const db = d[i + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function removeEdgeBackground(d: Uint8ClampedArray, w: number, h: number): void {
  const at = (x: number, y: number) => (y * w + x) * 4;
  const corners: [number, number][] = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  if (corners.some(([x, y]) => d[at(x, y) + 3] < 250)) return;

  const ref = at(0, 0);
  const r = d[ref];
  const g = d[ref + 1];
  const b = d[ref + 2];
  if (corners.some(([x, y]) => colorDist(d, at(x, y), r, g, b) > BG_TOLERANCE)) return;

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const toClear: number[] = [];

  const push = (x: number, y: number, from: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    if (colorDist(d, p * 4, r, g, b) > BG_TOLERANCE) return;
    // do not cross gradients (the edge of the product)
    if (from >= 0) {
      const f = from * 4;
      if (colorDist(d, p * 4, d[f], d[f + 1], d[f + 2]) > BG_STEP) return;
    }
    visited[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0, -1);
    push(x, h - 1, -1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y, -1);
    push(w - 1, y, -1);
  }

  while (stack.length) {
    const p = stack.pop()!;
    toClear.push(p);
    const x = p % w;
    const y = (p - x) / w;
    push(x + 1, y, p);
    push(x - 1, y, p);
    push(x, y + 1, p);
    push(x, y - 1, p);
  }

  // Safety: if most of the image would vanish, keep the original untouched.
  if (toClear.length / (w * h) > MAX_REMOVED) return;
  for (const p of toClear) d[p * 4 + 3] = 0;
}

async function normalizeImage(file: File, removeBg: boolean): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const shrink = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * shrink));
  const h = Math.max(1, Math.round(bitmap.height * shrink));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wctx = work.getContext('2d', { willReadFrequently: true })!;
  wctx.drawImage(bitmap, 0, 0, w, h);

  const imgData = wctx.getImageData(0, 0, w, h);
  if (removeBg) {
    removeEdgeBackground(imgData.data, w, h);
    wctx.putImageData(imgData, 0, 0);
  }

  const d = imgData.data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) {
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
  variants: AdminVariant[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { dir, t } = useAdminLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<FileRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [removeBg, setRemoveBg] = useState(true);
  const [phase, setPhase] = useState<'review' | 'uploading' | 'done'>('review');
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{ ok: number; skipped: number; failed: number }>({ ok: 0, skipped: 0, failed: 0 });

  // Products sorted by slug length (longest first) so the longest-prefix
  // match wins when multiple slugs could be a prefix of the file name.
  const productsBySlugDesc = useMemo(
    () => [...products].sort((a, b) => b.slug.length - a.slug.length),
    [products],
  );

  // Map: product_id -> variants of that product
  const variantsByProduct = useMemo(() => {
    const m = new Map<string, AdminVariant[]>();
    for (const v of variants) {
      if (!m.has(v.product_id)) m.set(v.product_id, []);
      m.get(v.product_id)!.push(v);
    }
    return m;
  }, [variants]);

  // Tolerant fallback: normalized product name -> product
  const normNameMap = useMemo(() => {
    const m = new Map<string, AdminProduct>();
    for (const p of products) m.set(normalize(p.name_en), p);
    return m;
  }, [products]);

  const matchFile = useCallback(
    (file: File): { target: MatchTarget; label: string | null } => {
      const base = file.name.replace(/\.[^.]+$/, '');
      const lower = base.toLowerCase();

      // Find the product whose slug is the longest prefix of the file name.
      let bestProduct: AdminProduct | null = null;
      for (const p of productsBySlugDesc) {
        const slug = p.slug.toLowerCase();
        if (lower === slug || lower.startsWith(slug + '-')) {
          bestProduct = p;
          break; // already sorted longest-first
        }
      }

      if (bestProduct) {
        const slugLower = bestProduct.slug.toLowerCase();
        // No remainder → product image
        if (lower === slugLower) {
          return { target: { kind: 'product', productId: bestProduct.id }, label: bestProduct.name_en };
        }
        // Remainder after the slug + '-' — try to match a variant color
        const rest = base.slice(slugLower.length + 1);
        const restNorm = colorNormalize(rest);
        const productVariants = variantsByProduct.get(bestProduct.id);
        if (productVariants) {
          for (const v of productVariants) {
            if (colorNormalize(v.color_en) === restNorm) {
              return {
                target: { kind: 'variant', productId: bestProduct.id, variantId: v.id },
                label: `${bestProduct.name_en} · ${v.color_en}`,
              };
            }
          }
        }
        // Slug matched but color didn't — default to product image
        return { target: { kind: 'product', productId: bestProduct.id }, label: bestProduct.name_en };
      }

      // Tolerant name match fallback
      const byName = normNameMap.get(normalize(base));
      if (byName) {
        return { target: { kind: 'product', productId: byName.id }, label: byName.name_en };
      }

      return { target: { kind: 'skip' }, label: null };
    },
    [productsBySlugDesc, variantsByProduct, normNameMap],
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
          return {
            ...r,
            target: { kind: 'variant', productId: v!.product_id, variantId },
            matchedLabel: v ? `${p?.name_en ?? ''} · ${v.color_en}` : null,
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
        let uploadBlob: Blob = row.file;
        let ext = row.file.name.split('.').pop()?.toLowerCase() ?? 'png';
        let mime = row.file.type;
        try {
          uploadBlob = await normalizeImage(row.file, removeBg);
          ext = 'webp';
          mime = 'image/webp';
        } catch {
          /* fall back to original file */
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
            .eq('id', row.target.variantId);
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
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'error', errorMsg: msg } : r)));
      }
      setProgress(Math.round(((i + 1) / toUpload.length) * 100));
    }

    skipped = rows.length - toUpload.length;
    setSummary({ ok, skipped, failed });
    setPhase('done');
    if (ok > 0) onDone();
  };

  const canConfirm = uploadable.length > 0 && phase === 'review';
  const failedRows = rows.filter((r) => r.status === 'error');

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
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={removeBg}
                onChange={(e) => setRemoveBg(e.target.checked)}
                className="h-4 w-4 accent-yellow-400"
              />
              <span>{dir === 'rtl' ? 'إزالة الخلفية تلقائياً' : 'Remove background automatically'}</span>
            </label>

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

            {failedRows.length > 0 && (
              <div className="space-y-2 rounded-xl border border-red-400/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
                  <AlertTriangle size={14} />
                  <span>{failedRows.length} failed</span>
                </div>
                {failedRows.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 text-xs">
                    <img src={r.preview} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-white/60" dir="ltr">{r.file.name}</div>
                      <div className="text-red-300/80" dir="ltr">{r.errorMsg}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
