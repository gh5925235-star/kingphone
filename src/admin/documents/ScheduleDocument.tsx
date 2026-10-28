import type { Lang } from '@/lib/i18n';
import type { AdminOrder, AdminOrderItem, AdminInstallment, AdminSettings } from '@/admin/lib/types';
import { adminTr } from '@/admin/lib/adminI18n';
import { formatCurrency3, formatDate } from '@/admin/lib/helpers';
import { DocPage, DocTable, DocRow, docSettingsFrom } from './DocChrome';

export function ScheduleDocument({
  order, items, installments, paidAmount, settings, lang,
}: {
  order: AdminOrder;
  items: AdminOrderItem[];
  installments: AdminInstallment[];
  paidAmount: number;
  settings: AdminSettings;
  lang: Lang;
}) {
  const t = (k: string) => adminTr(lang, k);
  const ds = docSettingsFrom(settings);
  const remaining = Number(order.total) - paidAmount;
  const now = new Date();
  const nextDue = installments.find((i) => !i.paid);

  const headers = ['#', t('order.col.dueDate'), t('order.col.amount'), t('order.col.state'), t('order.col.paidAt')];
  const rows = installments.map((inst) => {
    const overdue = !inst.paid && inst.due_date && new Date(inst.due_date) < now;
    return [
      inst.number,
      formatDate(inst.due_date, lang),
      formatCurrency3(inst.amount, lang, ds.currency),
      inst.paid ? t('order.instState.paid') : overdue ? t('order.instState.overdue') : t('order.instState.unpaid'),
      inst.paid ? formatDate(inst.paid_at, lang) : '—',
    ];
  });

  return (
    <DocPage
      lang={lang}
      title={t('doc.schedule.title')}
      docNumber={`${t('orders.col.number')}: ${order.order_number}`}
      date={`${t('doc.date')}: ${new Date(order.created_at || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-BH' : 'en-GB')}`}
      settings={ds}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: '#777' }}>{t('doc.customer')}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{order.customer_name || '—'}</div>
          <div style={{ fontSize: 11, color: '#444' }}>{order.phone || ''}</div>
        </div>
        <div>
          <DocRow label={t('order.total')} value={formatCurrency3(order.total, lang, ds.currency)} />
          <DocRow label={t('order.paidAmount')} value={formatCurrency3(paidAmount, lang, ds.currency)} />
          <DocRow label={t('order.remaining')} value={formatCurrency3(remaining, lang, ds.currency)} />
          <DocRow label={t('order.months')} value={String(order.installments_count ?? installments.length)} />
        </div>
      </div>

      <DocTable headers={headers} rows={rows} />

      {nextDue && (
        <div style={{ marginTop: 12, padding: '8px 10px', background: '#f8f5ee', borderRadius: 4, fontSize: 11, color: '#333' }}>
          {t('order.inst.nextDue')}: {formatDate(nextDue.due_date, lang)} — {formatCurrency3(nextDue.amount, lang, ds.currency)}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: '#666' }}>
        {items.map((it, idx) => (
          <div key={idx}>
            {idx + 1}. {it.name || ''}
            {it.capacity ? ` · ${it.capacity}` : ''}
          </div>
        ))}
      </div>
    </DocPage>
  );
}
