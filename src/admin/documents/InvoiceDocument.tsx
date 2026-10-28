import type { Lang } from '@/lib/i18n';
import type { AdminOrder, AdminOrderItem, AdminSettings } from '@/admin/lib/types';
import { adminTr } from '@/admin/lib/adminI18n';
import { formatCurrency3 } from '@/admin/lib/helpers';
import { DocPage, DocTable, DocRow, docSettingsFrom } from './DocChrome';

export function InvoiceDocument({
  order, items, paidAmount, settings, lang, vatPercent,
}: { order: AdminOrder; items: AdminOrderItem[]; paidAmount: number; settings: AdminSettings; lang: Lang; vatPercent: number }) {
  const t = (k: string) => adminTr(lang, k);
  const ds = docSettingsFrom(settings);
  const remaining = Number(order.total) - paidAmount;
  const headers = [t('order.col.item'), t('order.col.color'), t('order.col.capacity'), t('order.col.qty'), t('order.col.unitPrice'), t('order.col.lineTotal')];
  const rows = items.map((it) => [
    it.name || '',
    it.color || '',
    it.capacity || '—',
    it.qty ?? 0,
    formatCurrency3(it.price, lang, ds.currency),
    formatCurrency3(Number(it.price) * Number(it.qty), lang, ds.currency),
  ]);
  return (
    <DocPage lang={lang} title={t('doc.invoice.title')} docNumber={`${t('doc.invoice.number')}: ${order.order_number}`} date={`${t('doc.date')}: ${new Date(order.created_at || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-BH' : 'en-GB')}`} settings={ds}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: '#777' }}>{t('doc.customer')}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{order.customer_name || '—'}</div>
          <div style={{ fontSize: 11, color: '#444' }}>{order.phone || ''}</div>
          {order.cpr && <div style={{ fontSize: 11, color: '#444' }}>{t('doc.cpr')}: {order.cpr}</div>}
          {order.address && <div style={{ fontSize: 11, color: '#444' }}>{order.address}</div>}
        </div>
        <div>
          <DocRow label={t('order.paymentType')} value={t(`pay.${order.payment_type}`)} />
          <DocRow label={t('order.status')} value={t(`status.${order.status}`)} />
        </div>
      </div>
      <DocTable headers={headers} rows={rows} />
      <div style={{ marginTop: 12, maxWidth: '60%', marginInlineStart: 'auto' }}>
        <DocRow label={t('order.total')} value={formatCurrency3(order.total, lang, ds.currency)} />
        {vatPercent > 0 && <DocRow label={t('order.vat')} value={formatCurrency3(order.total * (vatPercent / 100), lang, ds.currency)} />}
        <DocRow label={t('order.paidAmount')} value={formatCurrency3(paidAmount, lang, ds.currency)} />
        <DocRow label={t('order.remaining')} value={formatCurrency3(remaining, lang, ds.currency)} />
      </div>
    </DocPage>
  );
}
