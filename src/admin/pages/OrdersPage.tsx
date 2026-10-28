import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, AlertTriangle, Loader2, Inbox } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchOrders } from '@/admin/lib/ordersApi';
import type { AdminOrder, AdminOrderStatus } from '@/admin/lib/types';
import { ORDER_STATUSES, formatCurrency3, formatDate } from '@/admin/lib/helpers';
import { StatusBadge, PaymentBadge } from '@/admin/components/Badges';

type StatusFilter = 'all' | AdminOrderStatus;
type PayFilter = 'all' | 'full' | 'installment';

export function OrdersPage() {
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [payFilter, setPayFilter] = useState<PayFilter>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toasts.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newCount = useMemo(() => orders.filter((o) => o.status === 'pending').length, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (payFilter !== 'all' && o.payment_type !== payFilter) return false;
      if (q) {
        const hay = `${o.order_number} ${o.customer_name ?? ''} ${o.phone ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, payFilter]);

  return (
    <div dir={dir}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('orders.title')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('orders.count', { count: filtered.length })}</p>
        </div>
        <Link to="/admin/orders/new" className="btn-gold px-4 py-2 text-xs">
          <Plus size={16} />
          <span className="hidden sm:inline">{t('orders.newOrder')}</span>
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            className="input-field ps-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="input-field sm:w-40">
          <option value="all">{t('admin.all')}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <select value={payFilter} onChange={(e) => setPayFilter(e.target.value as PayFilter)} className="input-field sm:w-40">
          <option value="all">{t('admin.all')}</option>
          <option value="full">{t('pay.full')}</option>
          <option value="installment">{t('pay.installment')}</option>
        </select>
      </div>

      {newCount > 0 && (
        <div className="mb-4 rounded-xl border border-gold-300/30 bg-gold-300/10 px-4 py-2 text-sm text-gold-200">
          {newCount} {t('status.pending')}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/45">
          <Inbox size={32} className="text-gold-300/40" />
          <span className="text-sm">{t('orders.empty')}</span>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-white/5 bg-ink-800 md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 text-white/50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.col.number')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.col.customer')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.col.phone')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('orders.col.total')}</th>
                  <th className="px-4 py-3 text-center font-medium">{t('orders.col.payment')}</th>
                  <th className="px-4 py-3 text-center font-medium">{t('orders.col.status')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('orders.col.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-semibold text-gold-200 hover:underline">{o.order_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-white/80">{o.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-white/60" dir="ltr">{o.phone || '—'}</td>
                    <td className="px-4 py-3 text-end font-semibold text-white">{formatCurrency3(o.total, lang)}</td>
                    <td className="px-4 py-3 text-center"><PaymentBadge type={o.payment_type} lang={lang} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.status} lang={lang} /></td>
                    <td className="px-4 py-3 text-white/50">{formatDate(o.created_at, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="card block p-4 transition-colors hover:border-gold-300/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gold-200">{o.order_number}</span>
                  <StatusBadge status={o.status} lang={lang} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-white/80">{o.customer_name || '—'}</span>
                  <PaymentBadge type={o.payment_type} lang={lang} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-white/50" dir="ltr">{o.phone || '—'}</span>
                  <span className="font-semibold text-white">{formatCurrency3(o.total, lang)}</span>
                </div>
                <div className="mt-2 text-xs text-white/40">{formatDate(o.created_at, lang)}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
