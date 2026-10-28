import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { formatCurrency3, formatDate } from '@/admin/lib/helpers';
import { StatusBadge, PaymentBadge } from '@/admin/components/Badges';
import type { AdminOrder } from '@/admin/lib/types';
import { asOrder } from '@/admin/lib/ordersApi';
import type { OrderRow } from '@/admin/lib/ordersApi';
import { Loader2, AlertTriangle, ShoppingCart, TrendingUp, CalendarClock, AlertCircle, ArrowRight } from 'lucide-react';

type Stats = {
  newOrders: number;
  monthOrders: number;
  monthSales: number;
  outstanding: number;
  dueSoonCount: number;
  dueSoonAmount: number;
};

export function DashboardPage() {
  const { lang, dir, t } = useAdminLang();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [o, inst] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('installments').select('amount, due_date, paid, order_id'),
      ]);
      if (o.error) throw o.error;
      if (inst.error) throw inst.error;

      const allOrders = (o.data ?? []).map((row) => asOrder(row as OrderRow));
      setOrders(allOrders);

      // Pending = "new"
      const newOrders = allOrders.filter((x) => x.status === 'pending').length;

      // This month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthOrders = allOrders.filter((x) => new Date(x.created_at || 0) >= monthStart);
      const monthSales = monthOrders.reduce((s, x) => s + Number(x.total), 0);

      // Outstanding installments (unpaid) and due-soon / overdue
      const installments = (inst.data ?? []) as { amount: number; due_date: string | null; paid: boolean }[];
      const unpaid = installments.filter((i) => !i.paid);
      const outstanding = unpaid.reduce((s, i) => s + Number(i.amount), 0);
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 7);
      const dueSoon = unpaid.filter((i) => i.due_date && new Date(i.due_date) <= horizon);
      const dueSoonAmount = dueSoon.reduce((s, i) => s + Number(i.amount), 0);

      setStats({
        newOrders,
        monthOrders: monthOrders.length,
        monthSales,
        outstanding,
        dueSoonCount: dueSoon.length,
        dueSoonAmount,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-white/50">
        <Loader2 size={20} className="animate-spin text-gold-300" />
        <span className="text-sm">{t('admin.loading')}</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="max-w-md text-sm text-white/70" dir="ltr">{error}</p>
        <button onClick={load} className="btn-ghost mt-2">{t('admin.retry')}</button>
      </div>
    );
  }

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('dash.title')}</h1>
        <span className="text-[11px] text-white/30">{t('dash.autoRefresh')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label={t('dash.newOrders')}
          value={String(stats?.newOrders ?? 0)}
          accent="gold"
          to="/admin/orders?status=pending"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dash.monthOrders')}
          value={String(stats?.monthOrders ?? 0)}
          accent="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dash.monthSales')}
          value={formatCurrency3(stats?.monthSales ?? 0, lang)}
          accent="emerald"
        />
        <StatCard
          icon={CalendarClock}
          label={t('dash.outstanding')}
          value={formatCurrency3(stats?.outstanding ?? 0, lang)}
          accent="blue"
        />
      </div>

      <div className="card flex items-center gap-3 border-amber-400/20 bg-amber-400/5 p-4">
        <AlertCircle size={20} className="shrink-0 text-amber-300" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-amber-200">{t('dash.dueSoon')}</div>
          <div className="text-xs text-amber-200/70">
            {stats?.dueSoonCount ?? 0} · {formatCurrency3(stats?.dueSoonAmount ?? 0, lang)}
          </div>
        </div>
        <Link to="/admin/orders?payment=installment" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:underline">
          <span>{t('dash.viewAll')}</span>
          <ArrowRight size={14} className={dir === 'rtl' ? 'rotate-180' : ''} />
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">{t('dash.latest')}</h2>
          <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs text-gold-200 hover:underline">
            <span>{t('dash.viewAll')}</span>
            <ArrowRight size={14} className={dir === 'rtl' ? 'rotate-180' : ''} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="card p-8 text-center text-sm text-white/40">{t('dash.noData')}</div>
        ) : (
          <div className="card divide-y divide-white/5">
            {orders.map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gold-200">{o.order_number}</span>
                    <StatusBadge status={o.status} lang={lang} />
                    <PaymentBadge type={o.payment_type} lang={lang} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-white/50">
                    {o.customer_name || '—'} · {formatDate(o.created_at, lang)}
                  </div>
                </div>
                <div className="text-end font-semibold text-white">{formatCurrency3(o.total, lang)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent, to,
}: {
  icon: typeof ShoppingCart;
  label: string;
  value: string;
  accent: 'gold' | 'emerald' | 'blue';
  to?: string;
}) {
  const accents: Record<string, string> = {
    gold: 'text-gold-200 bg-gold-300/10',
    emerald: 'text-emerald-200 bg-emerald-500/10',
    blue: 'text-blue-200 bg-blue-500/10',
  };
  const body = (
    <div className="card p-4 transition-colors hover:border-white/15">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${accents[accent]}`}>
        <Icon size={18} />
      </div>
      <div className="text-xs text-white/45">{label}</div>
      <div className="mt-1 text-lg font-bold text-white" dir="ltr">{value}</div>
    </div>
  );
  if (to) return <Link to={to}>{body}</Link>;
  return body;
}
