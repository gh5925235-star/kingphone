import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save, X, Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchCategories, upsertCategory, deleteCategory } from '@/admin/lib/ordersApi';
import type { AdminCategory } from '@/admin/lib/types';
import { ConfirmDialog } from '@/admin/components/ui';

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function CategoriesPage() {
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [delTarget, setDelTarget] = useState<AdminCategory | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const persist = async (c: AdminCategory) => {
    try {
      await upsertCategory(c);
      toasts.success(t('admin.success'));
      setEditing(null);
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const move = async (idx: number, dir2: -1 | 1) => {
    const target = idx + dir2;
    if (target < 0 || target >= cats.length) return;
    const next = [...cats];
    const a = { ...next[idx], sort_order: next[target].sort_order };
    const b = { ...next[target], sort_order: next[idx].sort_order };
    next[idx] = a;
    next[target] = b;
    setCats(next);
    try {
      await upsertCategory(a);
      await upsertCategory(b);
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
      await load();
    }
  };

  const onDelete = async () => {
    if (!delTarget) return;
    try {
      await deleteCategory(delTarget.id);
      setDelTarget(null);
      toasts.success(t('admin.deleted'));
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const newCat = (): AdminCategory => ({
    id: '',
    slug: '',
    name_ar: '',
    name_en: '',
    sort_order: cats.length ? Math.max(...cats.map((c) => c.sort_order)) + 1 : 0,
  });

  return (
    <div dir={dir}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t('cat.title')}</h1>
        <button onClick={() => setEditing(newCat())} className="btn-gold px-4 py-2 text-xs">
          <Plus size={16} />
          <span className="hidden sm:inline">{t('cat.new')}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-white/50">
          <Loader2 size={20} className="animate-spin text-gold-300" />
          <span className="text-sm">{t('admin.loading')}</span>
        </div>
      ) : error ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <AlertTriangle size={28} className="text-red-400" />
          <p className="max-w-md text-sm text-white/70" dir="ltr">{error}</p>
          <button onClick={load} className="btn-ghost mt-2">{t('admin.retry')}</button>
        </div>
      ) : cats.length === 0 && !editing ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/45">
          <Inbox size={32} className="text-gold-300/40" />
          <span className="text-sm">{t('cat.empty')}</span>
          <button onClick={() => setEditing(newCat())} className="btn-gold mt-2 px-4 py-2 text-xs">
            <Plus size={14} />
            <span>{t('cat.new')}</span>
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-white/5">
          {cats.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-20"
                  aria-label={t('cat.moveUp')}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === cats.length - 1}
                  className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-20"
                  aria-label={t('cat.moveDown')}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{lang === 'ar' ? c.name_ar : c.name_en}</div>
                <div className="text-xs text-white/40" dir="ltr">/{c.slug}</div>
              </div>
              <span className="text-xs text-white/30">{c.sort_order}</span>
              <button onClick={() => setEditing(c)} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:border-gold-300/40 hover:text-gold-200" aria-label={t('admin.edit')}>
                <Pencil size={14} />
              </button>
              <button onClick={() => setDelTarget(c)} className="rounded-lg border border-red-400/20 p-1.5 text-red-300/70 hover:bg-red-500/10 hover:text-red-200" aria-label={t('act.delete')}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CategoryEditor
          cat={editing}
          lang={lang}
          dir={dir}
          onClose={() => setEditing(null)}
          onSave={persist}
        />
      )}

      <ConfirmDialog
        open={!!delTarget}
        title={t('act.delete')}
        message={t('act.deleteConfirm')}
        confirmLabel={t('admin.delete')}
        cancelLabel={t('admin.cancel')}
        danger
        onConfirm={onDelete}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  );
}

function CategoryEditor({
  cat, lang, dir, onClose, onSave,
}: {
  cat: AdminCategory;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  onClose: () => void;
  onSave: (c: AdminCategory) => void;
}) {
  const { t } = useAdminLang();
  const [draft, setDraft] = useState<AdminCategory>({ ...cat });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof AdminCategory, value: string | number) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!draft.name_ar || !draft.name_en) return;
    setSaving(true);
    const payload = {
      ...draft,
      slug: draft.slug || slugify(draft.name_en || draft.name_ar),
      sort_order: Number(draft.sort_order),
    } as AdminCategory;
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-5"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{cat.id ? t('cat.edit') : t('cat.new')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label-field">{t('cat.nameAr')}</label>
            <input value={draft.name_ar} onChange={(e) => set('name_ar', e.target.value)} className="input-field" dir="rtl" autoFocus />
          </div>
          <div>
            <label className="label-field">{t('cat.nameEn')}</label>
            <input
              value={draft.name_en}
              onChange={(e) => { set('name_en', e.target.value); if (!cat.id && !draft.slug) set('slug', slugify(e.target.value)); }}
              className="input-field"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label-field">{t('cat.slug')}</label>
            <input value={draft.slug} onChange={(e) => set('slug', e.target.value)} className="input-field" dir="ltr" />
            <p className="mt-1 text-[11px] text-white/30">{t('cat.slugHint')}</p>
          </div>
          <div>
            <label className="label-field">{t('cat.sortOrder')}</label>
            <input type="number" value={draft.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} className="input-field" dir="ltr" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-xs">{t('admin.cancel')}</button>
          <button
            onClick={submit}
            disabled={saving || !draft.name_ar || !draft.name_en}
            className="btn-gold px-4 py-2 text-xs disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{t('cat.save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
