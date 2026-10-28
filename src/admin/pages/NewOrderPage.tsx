import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAdminLang } from '@/admin/lib/useAdminLang';
import { createOrder, nextOrderNumber, regenerateSchedule } from '@/admin/lib/ordersApi';
import { OrderForm, type OrderFormValues } from '@/admin/pages/OrderForm';

export function NewOrderPage() {
  const { lang, dir, t } = useAdminLang();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const initial: OrderFormValues = {
    customer_name: '',
    phone: '',
    email: '',
    cpr: '',
    address: '',
    notes: '',
    admin_notes: '',
    items: [],
    payment_type: 'full',
    payment_method: 'cash',
    down_payment: 0,
    installments_count: 3,
    status: 'pending',
    subtotal: 0,
    total: 0,
    paid_amount: 0,
    lang,
  };

  const onCreate = async (v: OrderFormValues) => {
    setCreating(true);
    try {
      const orderNumber = await nextOrderNumber();
      const months = v.payment_type === 'installment' ? Number(v.installments_count) : null;
      const created = await createOrder({
        order_number: orderNumber,
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
        installments_count: months,
        status: v.status,
        lang: v.lang,
        items: v.items,
      });
      if (v.payment_type === 'installment' && months && months > 0) {
        await regenerateSchedule(created.id, months, Number(v.down_payment), v.total);
      }
      navigate(`/admin/orders/${created.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>{t('admin.back')}</span>
      </Link>
      <h1 className="text-2xl font-bold text-white">{t('new.title')}</h1>
      {creating ? (
        <div className="flex items-center justify-center gap-3 py-16 text-white/50">
          <Loader2 size={20} className="animate-spin text-gold-300" />
          <span className="text-sm">{t('new.creating')}</span>
        </div>
      ) : (
        <OrderForm initial={initial} submitLabel={t('new.create')} onSubmit={onCreate} />
      )}
    </div>
  );
}
