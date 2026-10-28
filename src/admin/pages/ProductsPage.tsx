import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, Loader2, Inbox, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchProducts, deleteProduct, fetchAllVariants } from '@/admin/lib/ordersApi';
import type { AdminProduct, AdminVariant } from '@/admin/lib/types';
import { formatCurrency3 } from '@/admin/lib/helpers';
import { ConfirmDialog } from '@/admin/components/ui';
import { BulkImageUploadModal } from '@/admin/pages/BulkImageUploadModal';

export function ProductsPage() {
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<AdminProduct | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkVariants, setBulkVariants] = useState<(AdminVariant & { slug?: string })[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
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

  const onDelete = async () => {
    if (!delTarget) return;
    try {
      await deleteProduct(delTarget.id);
      setDelTarget(null);
      toasts.success(t('admin.deleted'));
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const openBulk = async () => {
    try {
      const vs = await fetchAllVariants();
      setBulkVariants(vs);
      setBulkOpen(true);
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div dir={dir}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t('nav.products')}</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={openBulk} className="btn-ghost px-4 py-2 text-xs">
            <UploadCloud size={16} />
            <span className="hidden sm:inline">{t('bulk.title')}</span>
          </button>
          <Link to="/admin/products/new" className="btn-gold px-4 py-2 text-xs">
            <Plus size={16} />
            <span className="hidden sm:inline">{t('orders.newOrder')}</span>
          </Link>
        </div>
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
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/45">
          <Inbox size={32} className="text-gold-300/40" />
          <span className="text-sm">{t('admin.empty')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="aspect-[4/3] bg-ink-900">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name_en} className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20">
                    <Inbox size={28} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{lang === 'ar' ? p.name_ar : p.name_en}</div>
                    <div className="text-xs text-white/40">{p.brand}</div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link to={`/admin/products/${p.id}`} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:border-gold-300/40 hover:text-gold-200">
                      <Pencil size={14} />
                    </Link>
                    <button onClick={() => setDelTarget(p)} className="rounded-lg border border-red-400/20 p-1.5 text-red-300/70 hover:bg-red-500/10 hover:text-red-200">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-gold-200">{formatCurrency3(p.base_price, lang)}</span>
                  <div className="flex gap-1.5">
                    {p.is_active && <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">ON</span>}
                    {p.is_featured && <span className="rounded-full border border-gold-300/30 bg-gold-300/10 px-2 py-0.5 text-[10px] font-semibold text-gold-200">★</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {bulkOpen && (
        <BulkImageUploadModal
          products={products}
          variants={bulkVariants}
          onClose={() => setBulkOpen(false)}
          onDone={load}
        />
      )}
    </div>
  );
}
