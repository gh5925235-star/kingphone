import type { Lang } from '@/lib/i18n';
import type { AdminOrder, AdminOrderItem, AdminInstallment, AdminSettings } from '@/admin/lib/types';
import { adminTr } from '@/admin/lib/adminI18n';
import { formatCurrency3, formatDate } from '@/admin/lib/helpers';
import { DocPage, DocTable, DocField, docSettingsFrom } from './DocChrome';

// Editable contract fields. The owner fills these in on the document page;
// they persist into orders.contract_fields and print as blank lines when empty.
export const CONTRACT_FIELDS_AR: { key: string; label: string }[] = [
  { key: 'contract_date', label: 'تاريخ العقد' },
  { key: 'contract_place', label: 'مكان العقد' },
  { key: 'nationality', label: 'جنسية المشتري' },
  { key: 'cpr', label: 'الرقم السكاني (CPR)' },
  { key: 'address', label: 'عنوان المشتري' },
  { key: 'employer', label: 'جهة العمل' },
  { key: 'monthly_salary', label: 'الراتب الشهري' },
  { key: 'guarantor_name', label: 'اسم الكفيل' },
  { key: 'guarantor_cpr', label: 'رقم الكفيل السكاني' },
  { key: 'guarantor_phone', label: 'هاتف الكفيل' },
  { key: 'guarantor_address', label: 'عنوان الكفيل' },
  { key: 'witness_name', label: 'اسم الشاهد' },
  { key: 'imei', label: 'رقم IMEI / التسلسلي' },
  { key: 'first_due_date', label: 'تاريخ أول قسط' },
  { key: 'late_penalty', label: 'غرامة التأخير' },
  { key: 'delivery_date', label: 'تاريخ التسليم' },
  { key: 'extra_clauses', label: 'بنود إضافية' },
];

export const CONTRACT_FIELDS_EN: { key: string; label: string }[] = [
  { key: 'contract_date', label: 'Contract date' },
  { key: 'contract_place', label: 'Contract place' },
  { key: 'nationality', label: 'Buyer nationality' },
  { key: 'cpr', label: 'CPR number' },
  { key: 'address', label: 'Buyer address' },
  { key: 'employer', label: 'Employer' },
  { key: 'monthly_salary', label: 'Monthly salary' },
  { key: 'guarantor_name', label: 'Guarantor name' },
  { key: 'guarantor_cpr', label: 'Guarantor CPR' },
  { key: 'guarantor_phone', label: 'Guarantor phone' },
  { key: 'guarantor_address', label: 'Guarantor address' },
  { key: 'witness_name', label: 'Witness name' },
  { key: 'imei', label: 'Device IMEI / serial' },
  { key: 'first_due_date', label: 'First installment due date' },
  { key: 'late_penalty', label: 'Late payment penalty' },
  { key: 'delivery_date', label: 'Delivery date' },
  { key: 'extra_clauses', label: 'Additional clauses' },
];

const DEFAULT_TERMS_AR = [
  'يبقى ملكية الجهاز لدى البائع حتى سداد كامل المبلغ.',
  'في حال التأخر عن سداد القسط أكثر من ١٥ يوماً يحق للبائع اتخاذ الإجراءات القانونية.',
  'في حال التعثر يصبح المبلغ المتبقي مستحقاً فوراً.',
  'يحق للمشتري تسوية الرصيد المتبقي قبل موعده.',
  'تخضع أحكام هذا العقد لقوانين مملكة البحرين.',
];

const DEFAULT_TERMS_EN = [
  'Ownership of the device remains with the seller until the full amount is paid.',
  'If an installment is delayed more than 15 days, the seller may take legal action.',
  'Upon default, the remaining balance becomes immediately due.',
  'The buyer may settle the remaining balance before its due date.',
  'This contract is governed by the laws of the Kingdom of Bahrain.',
];

export function ContractDocument({
  order, items, installments, settings, lang, fields,
}: {
  order: AdminOrder;
  items: AdminOrderItem[];
  installments: AdminInstallment[];
  settings: AdminSettings;
  lang: Lang;
  fields: Record<string, string>;
}) {
  const t = (k: string) => adminTr(lang, k);
  const ds = docSettingsFrom(settings);
  const isAr = lang === 'ar';
  const f = (key: string) => fields[key] ?? '';

  const termsRaw = isAr ? settings.contract_terms_ar : settings.contract_terms_en;
  const terms = termsRaw
    ? termsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : isAr ? DEFAULT_TERMS_AR : DEFAULT_TERMS_EN;
  const usingDefault = !termsRaw;

  const remaining = Number(order.total) - Number(order.down_payment ?? 0);
  const months = order.installments_count ?? 0;
  const monthly = months > 0 ? remaining / months : 0;

  const instHeaders = ['#', t('order.col.dueDate'), t('order.col.amount')];
  const instRows = installments.map((inst) => [
    inst.number,
    formatDate(inst.due_date, lang),
    formatCurrency3(inst.amount, lang, ds.currency),
  ]);

  const fieldDefs = isAr ? CONTRACT_FIELDS_AR : CONTRACT_FIELDS_EN;

  return (
    <DocPage
      lang={lang}
      title={t('doc.contract.title')}
      docNumber={`${t('orders.col.number')}: ${order.order_number}`}
      date={`${t('doc.date')}: ${f('contract_date') || new Date(order.created_at || Date.now()).toLocaleDateString(isAr ? 'ar-BH' : 'en-GB')}`}
      settings={ds}
    >
      {/* Parties */}
      <Section title={isAr ? 'الأطراف' : 'Parties'}>
        <p style={paraStyle}>
          {isAr
            ? `البائع: ${ds.storeNameAr} — سجل تجاري: ${ds.crNumber || '—'}`
            : `Seller: ${ds.storeNameEn} — CR: ${ds.crNumber || '—'}`}
        </p>
        <p style={paraStyle}>
          {isAr ? 'المشتري: ' : 'Buyer: '} {order.customer_name || '—'}
          {order.phone ? ` · ${order.phone}` : ''}
        </p>
      </Section>

      {/* Contract blanks */}
      <Section title={isAr ? 'بيانات العقد' : 'Contract details'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {fieldDefs.map((fd) => (
            <DocField key={fd.key} label={fd.label} value={f(fd.key)} />
          ))}
        </div>
      </Section>

      {/* Product details */}
      <Section title={isAr ? 'تفاصيل المنتج' : 'Product details'}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>{isAr ? 'الصنف' : 'Item'}</th>
              <th style={thStyle}>{isAr ? 'اللون' : 'Color'}</th>
              <th style={thStyle}>{isAr ? 'السعة' : 'Capacity'}</th>
              <th style={thStyle}>{isAr ? 'IMEI' : 'IMEI'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={tdStyle}>{it.name || '—'}</td>
                <td style={tdStyle}>{it.color || '—'}</td>
                <td style={tdStyle}>{it.capacity || '—'}</td>
                <td style={tdStyle}>{i === 0 ? (f('imei') || '—') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Financials */}
      <Section title={isAr ? 'البيان المالي' : 'Financial summary'}>
        <div style={{ maxWidth: '70%', marginInlineStart: 'auto' }}>
          <Line label={t('order.total')} value={formatCurrency3(order.total, lang, ds.currency)} />
          <Line label={t('order.downPayment')} value={formatCurrency3(order.down_payment, lang, ds.currency)} />
          <Line label={isAr ? 'المبلغ المتبقي' : 'Remaining'} value={formatCurrency3(remaining, lang, ds.currency)} />
          <Line label={t('order.months')} value={String(months || '—')} />
          <Line label={isAr ? 'القسط الشهري' : 'Monthly amount'} value={formatCurrency3(monthly, lang, ds.currency)} />
        </div>
      </Section>

      {/* Installment table */}
      {installments.length > 0 && (
        <Section title={isAr ? 'جدول الأقساط' : 'Installment schedule'}>
          <DocTable headers={instHeaders} rows={instRows} />
        </Section>
      )}

      {/* Terms */}
      <Section title={isAr ? 'الشروط والأحكام' : 'Terms and conditions'}>
        {usingDefault && (
          <p style={{ fontSize: 10, color: '#999', marginBottom: 6 }}>
            {isAr ? '(نموذج افتراضي — يُنصح بمراجعته مع محامٍ)' : '(Default template — review with a lawyer)'}
          </p>
        )}
        <ol style={{ paddingLeft: isAr ? 0 : 18, paddingRight: isAr ? 18 : 0, margin: 0 }}>
          {terms.map((term, i) => (
            <li key={i} style={{ ...paraStyle, marginBottom: 4 }}>
              {term}
            </li>
          ))}
        </ol>
      </Section>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <DocField label={t('doc.seller')} />
        <DocField label={t('doc.buyer')} value={order.customer_name || ''} />
        <DocField label={t('doc.guarantor')} value={f('guarantor_name')} />
        <DocField label={t('doc.witness')} value={f('witness_name')} />
      </div>
    </DocPage>
  );
}

const paraStyle: React.CSSProperties = { margin: '4px 0', fontSize: 12, color: '#222', lineHeight: 1.7 };
const thStyle: React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', background: '#f8f5ee', textAlign: 'start', fontWeight: 600 };
const tdStyle: React.CSSProperties = { border: '1px solid #eee', padding: '6px 8px', color: '#222' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#b8860b', margin: '0 0 8px' }}>{title}</h3>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      <span style={{ color: '#111', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
