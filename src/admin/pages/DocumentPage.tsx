import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, MessageCircle, Languages, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import { fetchOrder, fetchInstallments, fetchReceipts } from '@/admin/lib/ordersApi';
import type { AdminOrder, AdminOrderItem, AdminInstallment, AdminReceipt, AdminSettings, AdminPaymentMethod } from '@/admin/lib/types';
import { AdminError } from '@/admin/components/ui';
import { InvoiceDocument } from '@/admin/documents/InvoiceDocument';
import { ReceiptDocument } from '@/admin/documents/ReceiptDocument';
import { ScheduleDocument } from '@/admin/documents/ScheduleDocument';
import { ContractDocument, CONTRACT_FIELDS_AR, CONTRACT_FIELDS_EN } from '@/admin/documents/ContractDocument';
import { exportElementToPdfFile, triggerDownload, shareOnWhatsApp } from '@/admin/documents/exportPdf';
import { adminTr } from '@/admin/lib/adminI18n';

type DocType = 'invoice' | 'receipt' | 'schedule' | 'contract';

export function DocumentPage() {
  const { id = '', docType = '' } = useParams();
  const { lang, setLang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const previewRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);
  const [installments, setInstallments] = useState<AdminInstallment[]>([]);
  const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({});
  const [contractFields, setContractFields] = useState<Record<string, string>>({});
  const [docLang, setDocLang] = useState<'ar' | 'en'>('ar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Manual receipt (when no prior receipts exist): editable amount + method.
  const [manualAmount, setManualAmount] = useState('0');
  const [manualMethod, setManualMethod] = useState<AdminPaymentMethod>('cash');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { order: o, items: it } = await fetchOrder(id);
      const [inst, rc] = await Promise.all([
        fetchInstallments(id),
        fetchReceipts(id),
      ]);
      setOrder(o);
      setOrderItems(it);
      setInstallments(inst);
      setReceipts(rc);
      setDocLang(o.lang ?? 'ar');
      const { data: sdata, error: serr } = await supabase.from('settings').select('key, value');
      if (serr) throw serr;
      const map: AdminSettings = {};
      for (const row of sdata ?? []) map[row.key] = row.value;
      setSettings(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const vatPercent = parseFloat(settings.vat_percent || '0') || 0;
  const filename = `${docType}-${order?.order_number ?? id}`;
  const paidAmount = useMemo(() => receipts.reduce((s, r) => s + Number(r.amount), 0), [receipts]);

  const onDownload = async () => {
    if (!previewRef.current) return;
    setBusy(true);
    try {
      const file = await exportElementToPdfFile(previewRef.current, filename);
      triggerDownload(file, file.name);
      toasts.success(t('admin.success'));
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPrint = () => window.print();

  const onWhatsApp = async () => {
    if (!previewRef.current || !order) return;
    setBusy(true);
    try {
      const file = await exportElementToPdfFile(previewRef.current, filename);
      const digits = (order.phone || '').replace(/\D/g, '');
      const fullDigits = digits.length === 8 ? `973${digits}` : digits;
      const msg = docLang === 'ar'
        ? `مرحباً، مرفق ${adminTr(docLang, `doc.${docType}.title`)} لطلبك ${order.order_number} من كنج للهواتف`
        : `Hello, attached is your ${adminTr(docLang, `doc.${docType}.title`)} for order ${order.order_number} from King Phone`;
      const shared = await shareOnWhatsApp(file, fullDigits, msg);
      if (!shared) triggerDownload(file, file.name);
      toasts.success(t('admin.success'));
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-white/50">
        <Loader2 size={20} className="animate-spin text-gold-300" />
        <span className="text-sm">{t('admin.loading')}</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <BackLink orderId={id} dir={dir} />
        <AdminError message={error ?? 'Order not found'} onRetry={load} />
      </div>
    );
  }

  const validDoc = (['invoice', 'receipt', 'schedule', 'contract'] as DocType[]).includes(docType as DocType);
  if (!validDoc) {
    return (
      <div className="space-y-4">
        <BackLink orderId={order.id} dir={dir} />
        <AdminError message="Unknown document type" onRetry={load} />
      </div>
    );
  }

  const fieldDefs = docLang === 'ar' ? CONTRACT_FIELDS_AR : CONTRACT_FIELDS_EN;

  return (
    <div dir={dir} className="space-y-5">
      <BackLink orderId={order.id} dir={dir} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">{adminTr(docLang, `doc.${docType}.title`)}</h1>
        <div className="inline-flex overflow-hidden rounded-xl border border-white/10">
          <button
            onClick={() => setDocLang('ar')}
            className={`px-3 py-2 text-xs font-semibold ${docLang === 'ar' ? 'bg-gold-300/15 text-gold-200' : 'bg-ink-800 text-white/50'}`}
          >
            العربية
          </button>
          <button
            onClick={() => setDocLang('en')}
            className={`px-3 py-2 text-xs font-semibold ${docLang === 'en' ? 'bg-gold-300/15 text-gold-200' : 'bg-ink-800 text-white/50'}`}
          >
            English
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onDownload} disabled={busy} className="btn-gold px-4 py-2 text-xs">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span>{t('act.downloadPdf')}</span>
        </button>
        <button onClick={onPrint} className="btn-ghost px-4 py-2 text-xs">
          <Printer size={14} />
          <span>{t('act.print')}</span>
        </button>
        <button onClick={onWhatsApp} disabled={busy} className="btn-ghost px-4 py-2 text-xs">
          <MessageCircle size={14} />
          <span>{t('act.sendWhatsapp')}</span>
        </button>
        <button onClick={() => setLang(docLang === 'ar' ? 'en' : 'ar')} className="btn-ghost px-3 py-2 text-xs">
          <Languages size={14} />
          <span>{t('doc.language')}</span>
        </button>
      </div>

      {/* Contract fields editor (in-session only; prints into the document) */}
      {docType === 'contract' && (
        <section className="card p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-white/40">
            {docLang === 'ar' ? 'بيانات العقد' : 'Contract details'}
          </h2>
          <p className="mb-3 text-[11px] text-white/35">
            {docLang === 'ar'
              ? 'تُطبع في المستند فقط ولا تُحفظ في قاعدة البيانات.'
              : 'Printed into the document only — not saved to the database.'}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fieldDefs.map((fd) => (
              <div key={fd.key}>
                <label className="label-field">{fd.label}</label>
                <input
                  type="text"
                  value={contractFields[fd.key] ?? ''}
                  onChange={(e) => setContractFields((prev) => ({ ...prev, [fd.key]: e.target.value }))}
                  className="input-field"
                  dir={docLang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manual receipt amount/method when there are no saved receipts */}
      {docType === 'receipt' && receipts.length === 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            {docLang === 'ar' ? 'بيانات السند' : 'Receipt details'}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">{t('order.col.amount')}</label>
              <input type="number" step="0.001" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="label-field">{t('order.inst.method')}</label>
              <select value={manualMethod} onChange={(e) => setManualMethod(e.target.value as AdminPaymentMethod)} className="input-field">
                <option value="cash">{t('doc.method.cash')}</option>
                <option value="benefit">{t('doc.method.benefit')}</option>
                <option value="bank_transfer">{t('doc.method.bank_transfer')}</option>
                <option value="card">{t('doc.method.card')}</option>
                <option value="other">{t('doc.method.other')}</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Preview — rendered to PDF from this ref */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-800 p-4 print:bg-white">
        <div ref={previewRef} className="mx-auto">
          {docType === 'invoice' && (
            <InvoiceDocument order={order} items={orderItems} paidAmount={paidAmount} settings={settings} lang={docLang} vatPercent={vatPercent} />
          )}
          {docType === 'receipt' && (
            <ReceiptDocument
              order={order}
              receipt={receipts[0] ?? null}
              installment={null}
              settings={settings}
              lang={docLang}
              amount={receipts[0]?.amount ?? Number(manualAmount || 0)}
              method={(receipts[0]?.method ?? manualMethod) as AdminPaymentMethod}
            />
          )}
          {docType === 'schedule' && (
            <ScheduleDocument order={order} items={orderItems} installments={installments} paidAmount={paidAmount} settings={settings} lang={docLang} />
          )}
          {docType === 'contract' && (
            <ContractDocument
              order={order}
              items={orderItems}
              installments={installments}
              settings={settings}
              lang={docLang}
              fields={contractFields}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink({ orderId, dir }: { orderId: string; dir: 'rtl' | 'ltr' }) {
  const { t } = useAdminLang();
  return (
    <Link to={`/admin/orders/${orderId}`} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
      <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
      <span>{t('admin.back')}</span>
    </Link>
  );
}
