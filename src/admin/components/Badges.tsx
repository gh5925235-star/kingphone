import type { Lang } from '@/lib/i18n';
import type { AdminOrderStatus } from '@/admin/lib/types';
import { adminTr } from '@/admin/lib/adminI18n';
import { statusColor, paymentBadgeClass } from '@/admin/lib/helpers';

export function StatusBadge({ status, lang }: { status: AdminOrderStatus; lang: Lang }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(status)}`}>
      {adminTr(lang, `status.${status}`)}
    </span>
  );
}

export function PaymentBadge({ type, lang }: { type: 'full' | 'installment'; lang: Lang }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${paymentBadgeClass(type)}`}>
      {adminTr(lang, `pay.${type}`)}
    </span>
  );
}
