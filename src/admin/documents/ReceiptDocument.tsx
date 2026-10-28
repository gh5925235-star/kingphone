import type { Lang } from '@/lib/i18n';
import type { AdminOrder, AdminReceipt, AdminInstallment, AdminSettings, AdminPaymentMethod } from '@/admin/lib/types';
import { adminTr } from '@/admin/lib/adminI18n';
import { formatCurrency3 } from '@/admin/lib/helpers';
import { amountToWords } from './numberToWords';
import { DocPage, DocRow, DocField, docSettingsFrom } from './DocChrome';

export function ReceiptDocument({
  order, receipt, installment, settings, lang, amount, method,
}: {
  order: AdminOrder;
  receipt?: AdminReceipt | null;
  installment?: AdminInstallment | null;
  settings: AdminSettings;
  lang: Lang;
  amount: number;
  method: AdminPaymentMethod;
}) {
  const t = (k: string) => adminTr(lang, k);
  const ds = docSettingsFrom(settings);
  const receiptNumber = receipt?.receipt_number ?? '';
  const date = receipt?.received_at ? new Date(receipt.received_at) : new Date();
  const finalAmount = receipt ? receipt.amount : amount;
  return (
    <DocPage
      lang={lang}
      title={t('doc.receipt.title')}
      docNumber={`${t('doc.receipt.number')}: ${receiptNumber}`}
      date={`${t('doc.date')}: ${date.toLocaleDateString(lang === 'ar' ? 'ar-BH' : 'en-GB')}`}
      settings={ds}
    >
      <div style={{ marginBottom: 16 }}>
        <DocRow label={t('doc.receivedFrom')} value={order.customer_name || '—'} />
        <DocRow label={t('doc.amount')} value={formatCurrency3(finalAmount, lang, ds.currency)} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#333', fontStyle: 'italic' }}>
          {t('doc.amountInWords')}: {amountToWords(finalAmount, lang, ds.currency)}
        </div>
        <div style={{ marginTop: 10 }}>
          <DocRow label={t('doc.method')} value={t(`doc.method.${receipt ? receipt.method : method}`)} />
          <DocRow label={t('doc.forOrder')} value={order.order_number} />
          {installment && <DocRow label={t('doc.installmentNo')} value={String(installment.number)} />}
          <DocRow label={t('doc.receivedBy')} value={receipt?.received_by || '—'} />
        </div>
        {receipt?.note && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#555' }}>{receipt.note}</div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <DocField label={t('doc.seller')} value={receipt?.received_by} />
        <DocField label={t('doc.buyer')} value={order.customer_name || ''} />
      </div>
    </DocPage>
  );
}
