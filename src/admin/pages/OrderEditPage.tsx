import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { fetchOrder, updateOrder, replaceOrderItems } from '@/admin/lib/ordersApi';
import { OrderForm, type OrderFormValues } from '@/admin/pages/OrderForm';
import type { AdminOrder, AdminOrderItem } from '@/admin/lib/types';

export function OrderEditPage() {
  const { id = '' } = useParams();
  const { lang, dir, t } = useAdminLang();
  const navigate = useNavigate();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<AdminOrderItem[]>([]);
  const [initial, setInitial] = useState<OrderFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { order: o, items: it } = await fetchOrder(id);
      setOrder(o);
      setItems(it);
      setInitial({
        customer_name: o.customer_name,
        phone: o.phone,
        email: o.email ?? '',
        cpr: o.cpr ?? '',
        address: o.address ?? '',
        notes: o.notes ?? '',
        admin_notes: o.admin_notes ?? '',
        items: it.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          name: i.name ?? '',
          color: i.color ?? '',
          capacity: i.capacity ?? '',
          price: Number(i.price),
          qty: Number(i.qty),
        })),
        payment_type: o.payment_type,
        payment_method: o.payment_method,
        down_payment: Number(o.down_payment),
        installments_count: o.installments_count,
        status: o.status,
        subtotal: Number(o.subtotal),
        total: Number(o.total),
        paid_amount: Number(o.paid_amount),
        lang: o.lang,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (v: OrderFormValues) => {
    if (!order) return;
    await updateOrder(order.id, {
      customer_name: v.customer_name,
      phone: v.phone,
      email: v.email || null,
      cpr: v.cpr || null,
      address: v.address || null,
      notes: v.notes || null,
      admin_notes: v.admin_notes || null,
      subtotal: v.subtotal,
      total: v.total,
      paid_amount: v.paid_amount,
      payment_type: v.payment_type,
      payment_method: v.payment_method,
      down_payment: Number(v.down_payment),
      installments_count: v.payment_type === 'installment' ? Number(v.installments_count) : null,
      status: v.status,
      lang: v.lang,
    });
    await replaceOrderItems(order.id, v.items);
    navigate(`/admin/orders/${order.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-white/50">
        <Loader2 size={20} className="animate-spin text-gold-300" />
        <span className="text-sm">{t('admin.loading')}</span>
      </div>
    );
  }

  if (error || !order || !initial) {
    return (
      <div className="space-y-4">
        <BackLink id={id} dir={dir} />
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <AlertTriangle size={28} className="text-red-400" />
          <p className="max-w-md text-sm text-white/70" dir="ltr">{error ?? 'Order not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink id={order.id} dir={dir} />
      <h1 className="text-2xl font-bold text-white">{t('order.editTitle')} · {order.order_number}</h1>
      <OrderForm initial={initial} submitLabel={t('admin.save')} onSubmit={onSave} />
    </div>
  );

  function BackLink({ id, dir }: { id: string; dir: 'rtl' | 'ltr' }) {
    return (
      <Link to={`/admin/orders/${id}`} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>{t('admin.back')}</span>
      </Link>
    );
  }
}
