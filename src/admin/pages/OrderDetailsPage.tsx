import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, Receipt, CalendarClock, Edit, Trash2, MessageCircle,
  AlertTriangle, Loader2, RefreshCw, Printer,
} from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { useToasts } from '@/admin/lib/useToasts';
import {
  fetchOrder, fetchInstallments, fetchReceipts,
  updateOrderStatus, deleteOrder, regenerateSchedule,
  nextReceiptNumber,
} from '@/admin/lib/ordersApi';
import type { AdminOrder, AdminOrderItem, AdminInstallment, AdminReceipt, AdminOrderStatus, AdminPaymentMethod } from '@/admin/lib/types';
import {
  ORDER_STATUSES, PAYMENT_METHODS, formatCurrency3, formatDate, formatDateTime, whatsappLink,
} from '@/admin/lib/helpers';
import { StatusBadge, PaymentBadge } from '@/admin/components/Badges';
import { AdminError, ConfirmDialog, Modal } from '@/admin/components/ui';
import { supabase } from '@/lib/supabase';

export function OrderDetailsPage() {
  const { id = '' } = useParams();
  const { lang, dir, t } = useAdminLang();
  const toasts = useToasts();
  const navigate = useNavigate();

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<AdminOrderItem[]>([]);
  const [installments, setInstallments] = useState<AdminInstallment[]>([]);
  const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [payInst, setPayInst] = useState<AdminInstallment | null>(null);
  const [paidDone, setPaidDone] = useState(false);

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
      setItems(it);
      setInstallments(inst);
      setReceipts(rc);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const paidAmount = useMemo(
    () => receipts.reduce((s, r) => s + Number(r.amount), 0),
    [receipts],
  );

  const onStatusChange = async (status: AdminOrderStatus) => {
    if (!order) return;
    try {
      await updateOrderStatus(order.id, status);
      setOrder({ ...order, status });
      toasts.success(t('admin.success'));
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const onDelete = async () => {
    if (!order) return;
    try {
      await deleteOrder(order.id);
      toasts.success(t('admin.deleted'));
      navigate('/admin/orders');
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const onRegenerate = async (months: number, downPayment: number, firstDueDate: string) => {
    if (!order) return;
    try {
      await regenerateSchedule(order.id, months, downPayment, Number(order.total), firstDueDate || undefined);
      setRegenOpen(false);
      toasts.success(t('admin.success'));
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
    }
  };

  const markPaid = async (amount: number, method: AdminPaymentMethod, receivedBy: string, note: string, date: string) => {
    if (!payInst || !order) return;
    try {
      const receiptNumber = await nextReceiptNumber();
      const { error: rcErr } = await supabase.from('receipts').insert({
        receipt_number: receiptNumber,
        order_id: order.id,
        installment_id: payInst.id,
        amount,
        method,
        received_at: date || new Date().toISOString(),
        received_by: receivedBy || null,
        note: note || null,
      });
      if (rcErr) throw rcErr;
      const { error: instErr } = await supabase
        .from('installments')
        .update({ paid: true, paid_at: date || new Date().toISOString() })
        .eq('id', payInst.id);
      if (instErr) throw instErr;
      toasts.success(t('order.inst.receiptSaved'));
      setPayInst(null);
      setPaidDone(true);
      await load();
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : String(e));
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

  const remaining = Number(order.total) - paidAmount;
  const now = new Date();
  const nextDue = installments.find((i) => !i.paid);

  return (
    <div dir={dir} className="space-y-6">
      <BackLink orderId={order.id} dir={dir} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} lang={lang} />
            <PaymentBadge type={order.payment_type} lang={lang} />
            <span className="text-xs text-white/40">{formatDateTime(order.created_at, lang)}</span>
          </div>
        </div>
        <select value={order.status} onChange={(e) => onStatusChange(e.target.value as AdminOrderStatus)} className="input-field sm:w-44">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionLink to={`/admin/orders/${order.id}/doc/invoice`} icon={FileText} label={t('act.invoice')} />
        {order.payment_type === 'installment' && (
          <>
            <ActionLink to={`/admin/orders/${order.id}/doc/contract`} icon={FileText} label={t('act.contract')} />
            <ActionLink to={`/admin/orders/${order.id}/doc/schedule`} icon={CalendarClock} label={t('act.schedule')} />
          </>
        )}
        <ActionLink to={`/admin/orders/${order.id}/doc/receipt`} icon={Receipt} label={t('act.receipt')} />
        <a
          href={whatsappLink(order.phone, lang === 'ar' ? 'مرحباً، بخصوص طلبك من كنج للهواتف' : 'Hello, regarding your King Phone order')}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost px-3 py-2 text-xs"
        >
          <MessageCircle size={16} />
          <span>{t('act.whatsapp')}</span>
        </a>
        <Link to={`/admin/orders/${order.id}/edit`} className="btn-ghost px-3 py-2 text-xs">
          <Edit size={16} />
          <span>{t('act.edit')}</span>
        </Link>
        <button onClick={() => setDeleteOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20">
          <Trash2 size={16} />
          <span>{t('act.delete')}</span>
        </button>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">{t('order.customer')}</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label={t('doc.customer')} value={order.customer_name} />
          <Field label={t('doc.phone')} value={order.phone} ltr />
          <Field label={t('doc.cpr')} value={order.cpr} ltr />
          <Field label={t('doc.address')} value={order.address} />
          {order.email && <Field label={t('order.customerEmail')} value={order.email} ltr />}
          {order.notes && <Field label={t('order.customerNotes')} value={order.notes} />}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
          {t('order.items')} · {t('order.itemsCount', { count: items.length })}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/40">
              <tr className="border-b border-white/5">
                <th className="px-2 py-2 text-start font-medium">{t('order.col.item')}</th>
                <th className="px-2 py-2 text-start font-medium">{t('order.col.color')}</th>
                <th className="px-2 py-2 text-start font-medium">{t('order.col.capacity')}</th>
                <th className="px-2 py-2 text-end font-medium">{t('order.col.qty')}</th>
                <th className="px-2 py-2 text-end font-medium">{t('order.col.unitPrice')}</th>
                <th className="px-2 py-2 text-end font-medium">{t('order.col.lineTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-white/5">
                  <td className="px-2 py-2 text-white/80">{it.name || '—'}</td>
                  <td className="px-2 py-2 text-white/60">{it.color || '—'}</td>
                  <td className="px-2 py-2 text-white/60">{it.capacity || '—'}</td>
                  <td className="px-2 py-2 text-end text-white/70">{it.qty ?? 0}</td>
                  <td className="px-2 py-2 text-end text-white/70">{formatCurrency3(it.price, lang)}</td>
                  <td className="px-2 py-2 text-end font-semibold text-white">{formatCurrency3(Number(it.price) * Number(it.qty), lang)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-2 py-6 text-center text-white/40">—</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">{t('order.totals')}</h2>
        <dl className="space-y-2 text-sm">
          <Row label={t('order.total')} value={formatCurrency3(order.total, lang)} strong />
          <Row label={t('order.paidAmount')} value={formatCurrency3(paidAmount, lang)} />
          <Row label={t('order.remaining')} value={formatCurrency3(remaining, lang)} />
          {order.payment_type === 'installment' && (
            <>
              <Row label={t('order.downPayment')} value={formatCurrency3(order.down_payment, lang)} />
              <Row label={t('order.months')} value={String(order.installments_count ?? '—')} />
            </>
          )}
        </dl>
      </section>

      {order.payment_type === 'installment' && (
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">{t('order.installments')}</h2>
            <button onClick={() => setRegenOpen(true)} className="btn-ghost px-3 py-1.5 text-xs">
              <RefreshCw size={14} />
              <span>{t('act.regenerate')}</span>
            </button>
          </div>
          {installments.length === 0 ? (
            <p className="text-sm text-white/40">{t('order.inst.noInstallments')}</p>
          ) : (
            <>
              {nextDue && (
                <div className="mb-3 rounded-lg border border-gold-300/30 bg-gold-300/10 px-3 py-2 text-xs text-gold-200">
                  {t('order.inst.nextDue')}: {formatDate(nextDue.due_date, lang)} — {formatCurrency3(nextDue.amount, lang)}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/40">
                    <tr className="border-b border-white/5">
                      <th className="px-2 py-2 text-start font-medium">#</th>
                      <th className="px-2 py-2 text-start font-medium">{t('order.col.dueDate')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('order.col.amount')}</th>
                      <th className="px-2 py-2 text-center font-medium">{t('order.col.state')}</th>
                      <th className="px-2 py-2 text-start font-medium">{t('order.col.paidAt')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst) => {
                      const overdue = !inst.paid && inst.due_date && new Date(inst.due_date) < now;
                      return (
                        <tr key={inst.id} className="border-b border-white/5">
                          <td className="px-2 py-2 text-white/60">{inst.number}</td>
                          <td className="px-2 py-2 text-white/70">{formatDate(inst.due_date, lang)}</td>
                          <td className="px-2 py-2 text-end font-semibold text-white">{formatCurrency3(inst.amount, lang)}</td>
                          <td className="px-2 py-2 text-center">
                            {inst.paid ? (
                              <span className="text-xs font-semibold text-emerald-300">{t('order.instState.paid')}</span>
                            ) : overdue ? (
                              <span className="text-xs font-semibold text-red-300">{t('order.instState.overdue')}</span>
                            ) : (
                              <span className="text-xs font-semibold text-white/50">{t('order.instState.unpaid')}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-white/50">{formatDate(inst.paid_at, lang)}</td>
                          <td className="px-2 py-2 text-end">
                            {!inst.paid && (
                              <button onClick={() => setPayInst(inst)} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20">
                                {t('order.inst.markPaid')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title={t('act.delete')}
        message={t('act.deleteConfirm')}
        confirmLabel={t('admin.delete')}
        cancelLabel={t('admin.cancel')}
        danger
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {regenOpen && order && (
        <RegenerateScheduleModal
          months={order.installments_count ?? 3}
          downPayment={Number(order.down_payment)}
          lang={lang}
          dir={dir}
          onClose={() => setRegenOpen(false)}
          onSave={onRegenerate}
        />
      )}

      {payInst && (
        <MarkPaidModal installment={payInst} lang={lang} dir={dir} onClose={() => setPayInst(null)} onSave={markPaid} />
      )}

      <Modal
        open={paidDone}
        title={t('order.inst.receiptSaved')}
        onClose={() => setPaidDone(false)}
        footer={
          <>
            <button onClick={() => setPaidDone(false)} className="btn-ghost px-4 py-2 text-xs">{t('admin.cancel')}</button>
            <button
              onClick={() => { setPaidDone(false); navigate(`/admin/orders/${order.id}/doc/receipt`); }}
              className="btn-gold px-4 py-2 text-xs"
            >
              <Printer size={14} />
              <span>{t('order.inst.printReceipt')}</span>
            </button>
          </>
        }
      >
        <p className="text-sm text-white/70">{t('order.inst.printReceipt')}?</p>
      </Modal>
    </div>
  );

  function BackLink({ orderId, dir }: { orderId: string; dir: 'rtl' | 'ltr' }) {
    return (
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>{t('admin.back')}</span>
      </Link>
    );
  }
}

function ActionLink({ to, icon: Icon, label }: { to: string; icon: typeof FileText; label: string }) {
  return (
    <Link to={to} className="btn-ghost px-3 py-2 text-xs">
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}

function Field({ label, value, ltr }: { label: string; value?: string | null; ltr?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="mt-0.5 text-white/85" dir={ltr ? 'ltr' : undefined}>{value || '—'}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-white/55">{label}</dt>
      <dd className={strong ? 'font-bold text-gold-200' : 'text-white/85'}>{value}</dd>
    </div>
  );
}

function RegenerateScheduleModal({
  months, downPayment, lang, dir, onClose, onSave,
}: {
  months: number;
  downPayment: number;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  onClose: () => void;
  onSave: (months: number, downPayment: number, firstDueDate: string) => void;
}) {
  const { t } = useAdminLang();
  const [m, setM] = useState(String(months));
  const [dp, setDp] = useState(String(downPayment));
  const [firstDue, setFirstDue] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Modal
      open
      title={t('order.regenerateTitle')}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-xs">{t('admin.cancel')}</button>
          <button
            onClick={() => onSave(Number(m) || 0, Number(dp) || 0, firstDue ? new Date(firstDue).toISOString() : '')}
            className="btn-gold px-4 py-2 text-xs"
          >
            {t('act.regenerate')}
          </button>
        </>
      }
    >
      <div className="space-y-3" dir={dir}>
        <p className="text-xs text-white/50">{t('order.regenerateHint')}</p>
        <div>
          <label className="label-field">{t('order.months')}</label>
          <input type="number" min={1} value={m} onChange={(e) => setM(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('order.downPayment')}</label>
          <input type="number" step="0.001" min={0} value={dp} onChange={(e) => setDp(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('order.firstDueDate')}</label>
          <input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <p className="text-[11px] text-white/30">{lang === 'ar' ? 'يتم الاحتفاظ بالأقساط المدفوعة فقط.' : 'Paid installments are kept.'}</p>
      </div>
    </Modal>
  );
}

function MarkPaidModal({
  installment, lang, dir, onClose, onSave,
}: {
  installment: AdminInstallment;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  onClose: () => void;
  onSave: (amount: number, method: AdminPaymentMethod, receivedBy: string, note: string, date: string) => void;
}) {
  const { t } = useAdminLang();
  const [amount, setAmount] = useState(String(installment.amount));
  const [method, setMethod] = useState<AdminPaymentMethod>('cash');
  const [receivedBy, setReceivedBy] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  return (
    <Modal
      open
      title={t('order.inst.markPaidTitle')}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-xs">{t('admin.cancel')}</button>
          <button
            onClick={() => onSave(Number(amount) || 0, method, receivedBy, note, new Date(date).toISOString())}
            className="btn-gold px-4 py-2 text-xs"
          >
            {t('admin.save')}
          </button>
        </>
      }
    >
      <div className="space-y-3" dir={dir}>
        <div>
          <label className="label-field">{t('order.col.amount')}</label>
          <input type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('order.inst.method')}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as AdminPaymentMethod)} className="input-field">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{t(`doc.method.${m}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">{t('doc.date')}</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" dir="ltr" />
        </div>
        <div>
          <label className="label-field">{t('order.inst.receivedBy')}</label>
          <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label-field">{t('order.inst.note')}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input-field" />
        </div>
        <p className="text-xs text-white/40" dir="ltr">#{installment.number} · {lang === 'ar' ? 'قسط' : 'Installment'}</p>
      </div>
    </Modal>
  );
}
