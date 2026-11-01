import { useState } from 'react';
import type { AdminOrder, AdminOrderItem, AdminInstallment, AdminSettings } from '@/admin/lib/types';
import { formatCurrency3, formatDate } from '@/admin/lib/helpers';

/* ---------------------------------------------------------------------------
   عقد بيع بالتقسيط وإقرار مديونية
   كل البيانات بتتعبّى تلقائي من الطلب: الاسم، الرقم الشخصي، الهاتف، العنوان،
   الجهاز (الاسم + السعة + اللون)، الأسعار، الدفعة الأولى، المدة، القسط الشهري،
   وتاريخ أول قسط من جدول الأقساط.
   الحقول الاختيارية (CONTRACT_FIELDS) ليها قيم افتراضية، مش لازم تكتب فيها حاجة.
--------------------------------------------------------------------------- */

export type ContractFieldDef = { key: string; label: string; placeholder?: string };

export const CONTRACT_FIELDS_AR: ContractFieldDef[] = [
  { key: 'imei', label: 'IMEI / السيريال (اختياري)', placeholder: 'يظهر بجانب اسم الجهاز لو كتبته' },
  { key: 'warranty', label: 'مدة الضمان', placeholder: 'عامين' },
  { key: 'firstDate', label: 'تاريخ القسط الأول', placeholder: 'من جدول الأقساط تلقائياً' },
  { key: 'payApp', label: 'وسيلة الدفع', placeholder: 'تطبيق بنفت باي' },
  { key: 'lateMonths', label: 'مدة التأخر قبل الرسوم (بالشهور)', placeholder: '3' },
  { key: 'lateFee', label: 'رسوم التأخير (د.ب)', placeholder: '10.000' },
  { key: 'sellerName', label: 'اسم البائع الكامل في العقد', placeholder: 'مؤسسة (اسم المتجر) للتجارة والتوزيع' },
];

export const CONTRACT_FIELDS_EN: ContractFieldDef[] = [
  { key: 'imei', label: 'IMEI / Serial (optional)', placeholder: 'Shown next to the device name if entered' },
  { key: 'warranty', label: 'Warranty period', placeholder: 'two years' },
  { key: 'firstDate', label: 'First installment date', placeholder: 'From the schedule automatically' },
  { key: 'payApp', label: 'Payment method', placeholder: 'Benefit Pay app' },
  { key: 'lateMonths', label: 'Delay before fees (months)', placeholder: '3' },
  { key: 'lateFee', label: 'Late fee (BHD)', placeholder: '10.000' },
  { key: 'sellerName', label: 'Seller full name in contract', placeholder: 'Store name' },
];

/* ------------------------------ أرقام بالحروف ------------------------------ */

const AR_UNITS: Record<number, string> = {
  1: 'واحد', 2: 'اثنان', 3: 'ثلاثة', 4: 'أربعة', 5: 'خمسة', 6: 'ستة', 7: 'سبعة', 8: 'ثمانية', 9: 'تسعة',
  10: 'عشرة', 11: 'أحد عشر', 12: 'اثنا عشر', 13: 'ثلاثة عشر', 14: 'أربعة عشر', 15: 'خمسة عشر',
  16: 'ستة عشر', 17: 'سبعة عشر', 18: 'ثمانية عشر', 19: 'تسعة عشر', 20: 'عشرون', 25: 'خمسة وعشرون',
  30: 'ثلاثون', 40: 'أربعون', 50: 'خمسون', 100: 'مئة',
};

function arDinarWords(n: number): string {
  if (!Number.isInteger(n) || n <= 0) return '';
  if (n === 1) return 'دينار بحريني واحد';
  if (n === 2) return 'ديناران بحرينيان';
  const w = AR_UNITS[n];
  if (!w) return '';
  return n <= 10 ? `${w} دنانير بحرينية` : `${w} ديناراً بحرينياً`;
}

function arMonthsWords(n: number): string {
  if (n === 1) return 'شهر واحد';
  if (n === 2) return 'شهرين متتاليين';
  if (n >= 3 && n <= 10) return `${AR_UNITS[n]} أشهر متتالية`;
  return `${n} شهراً متتالياً`;
}

const EN_NUM: Record<number, string> = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
  10: 'ten', 11: 'eleven', 12: 'twelve', 15: 'fifteen', 20: 'twenty', 25: 'twenty-five', 30: 'thirty',
  40: 'forty', 50: 'fifty', 100: 'one hundred',
};

/* ------------------------------ الختم ------------------------------ */

function Seal({ name }: { name: string }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src="/stamp.png"
        alt=""
        onError={() => setOk(false)}
        style={{ width: 110, height: 110, objectFit: 'contain' }}
      />
    );
  }
  return (
    <div
      style={{
        width: 104,
        height: 104,
        borderRadius: '50%',
        border: '2px solid #1f3a6e',
        boxShadow: 'inset 0 0 0 5px #fff, inset 0 0 0 6.5px #1f3a6e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#1f3a6e',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1.3,
        padding: 14,
        transform: 'rotate(-8deg)',
      }}
    >
      {name}
    </div>
  );
}

/* ------------------------------ المستند ------------------------------ */

export function ContractDocument({
  order,
  items,
  installments,
  settings,
  lang,
  fields,
}: {
  order: AdminOrder;
  items: AdminOrderItem[];
  installments: AdminInstallment[];
  settings: AdminSettings;
  lang: 'ar' | 'en';
  fields: Record<string, string>;
}) {
  const ar = lang === 'ar';
  const f = (k: string) => (fields[k] ?? '').trim();

  /* ---- بيانات من الطلب ---- */
  const storeAr = settings.store_name_ar || 'كنج للهواتف';
  const storeEn = settings.store_name_en || 'King Phone';
  const storeName = ar ? storeAr : storeEn;
  const sellerName =
    f('sellerName') || (ar ? `مؤسسة ${storeAr} للتجارة والتوزيع` : `${storeEn} Trading & Distribution`);

  const buyer = order.customer_name || (ar ? 'غير محدد' : 'Not specified');
  const cpr = order.cpr || (ar ? 'غير محدد' : 'Not specified');
  const phone = order.phone || '—';
  const address = order.address || (ar ? 'غير محدد' : 'Not specified');

  const device =
    items
      .map((it) => {
        const parts = [
          `${it.name ?? ''}${it.capacity ? ` ${it.capacity}` : ''}${Number(it.qty) > 1 ? ` × ${it.qty}` : ''}`.trim(),
          it.color ?? '',
        ].filter(Boolean);
        return parts.join(' - ');
      })
      .join(ar ? ' + ' : ' + ') + (f('imei') ? ` (IMEI/Serial: ${f('imei')})` : '');

  const total = Number(order.total || 0);
  const down = Number(order.down_payment || 0);
  const remaining = Math.max(0, total - down);
  const months = Number(order.installments_count || 0);

  const sorted = [...installments].sort((a, b) => String(a.due_date ?? '').localeCompare(String(b.due_date ?? '')));
  const monthly = sorted.length
    ? Number(sorted[0].amount)
    : months > 0
      ? remaining / months
      : 0;
  const firstDate = f('firstDate') || (sorted[0]?.due_date ? formatDate(sorted[0].due_date, lang) : '—');

  const contractNo = `CON-${order.order_number}`;
  const when = order.created_at ? new Date(order.created_at) : new Date();
  const dateText = new Intl.DateTimeFormat(ar ? 'ar-BH-u-nu-latn' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(when);

  const warranty = f('warranty') || (ar ? 'عامين' : 'two years');
  const payApp = f('payApp') || (ar ? 'تطبيق بنفت باي' : 'Benefit Pay app');
  const lateMonthsN = Number(f('lateMonths') || 3);
  const feeN = Number(f('lateFee') || 10);
  const feeText = (Number.isFinite(feeN) ? feeN : 10).toFixed(3);
  const feeWordsAr = arDinarWords(feeN);
  const feeWordsEn = Number.isInteger(feeN) && EN_NUM[feeN] ? `${EN_NUM[feeN]} Bahraini dinars` : '';
  const lateWordsAr = arMonthsWords(Number.isFinite(lateMonthsN) ? lateMonthsN : 3);
  const lateWordsEn = `${EN_NUM[lateMonthsN] ?? lateMonthsN} consecutive months`;
  const extraTerms = ar ? settings.contract_terms_ar : settings.contract_terms_en;

  /* ---- ستايلات ---- */
  const ink = '#1a1a1a';
  const accent = '#a30f15';
  const gold = '#c9a24d';
  const align = ar ? 'right' : 'left';
  const h: React.CSSProperties = { fontWeight: 700, margin: '14px 0 4px', fontSize: 13, color: ink };
  const p: React.CSSProperties = { margin: 0, fontSize: 12, lineHeight: 1.95, textAlign: align };
  const thStyle: React.CSSProperties = {
    background: '#f3f4f6',
    border: '1px solid #cfd6df',
    padding: '8px 6px',
    fontSize: 11.5,
    textAlign: 'center',
  };
  const tdStyle: React.CSSProperties = {
    border: '1px solid #cfd6df',
    padding: '9px 6px',
    fontSize: 12,
    textAlign: 'center',
  };

  const T = ar
    ? {
        sub: 'مملكة البحرين • أجهزة وهواتف ذكية بأقساط ميسرة',
        no: 'الرقم',
        date: 'التاريخ',
        title: 'عقد بيع بالتقسيط وإقرار مديونية',
        first: 'الطرف الأول (البائع)',
        second: 'الطرف الثاني (المشتري / المدين)',
        cpr: 'الرقم الشخصي (CPR)',
        phone: 'رقم الهاتف (واتساب)',
        addr: 'العنوان المختار',
        c1: 'البند الأول: بيانات المبيع والتسليم',
        c2: 'البند الثاني: القيمة المالية وجدول السداد',
        c3: 'البند الثالث: إقرار المديونية',
        c4: 'البند الرابع: التأخر عن السداد والرسوم الإدارية',
        c5: 'البند الخامس: الإخطارات والمراسلات',
        c6: 'البند السادس: شروط إضافية',
        th: ['إجمالي القيمة', 'الدفعة الأولى', 'المبلغ المتبقي', 'مدة التقسيط', 'القسط الشهري'],
        monthsLabel: months > 0 ? `${months} شهراً` : '—',
        sellerSign: 'الطرف الأول (البائع)',
        sealSign: 'التوقيع والختم',
        buyerSign: 'الطرف الثاني (المشتري)',
        live: 'التوقيع الحي',
        e: '(توقيع العميل الإلكتروني معتمد)',
      }
    : {
        sub: 'Kingdom of Bahrain • Smartphones & devices on easy installments',
        no: 'No.',
        date: 'Date',
        title: 'Installment Sale Contract & Acknowledgment of Debt',
        first: 'First Party (Seller)',
        second: 'Second Party (Buyer / Debtor)',
        cpr: 'CPR',
        phone: 'Phone (WhatsApp)',
        addr: 'Chosen address',
        c1: 'Article 1: Sale and Delivery Details',
        c2: 'Article 2: Financial Value and Payment Schedule',
        c3: 'Article 3: Acknowledgment of Debt',
        c4: 'Article 4: Late Payment and Administrative Fees',
        c5: 'Article 5: Notices and Correspondence',
        c6: 'Article 6: Additional Terms',
        th: ['Total value', 'Down payment', 'Remaining amount', 'Installment period', 'Monthly installment'],
        monthsLabel: months > 0 ? `${months} months` : '—',
        sellerSign: 'First Party (Seller)',
        sealSign: 'Signature & stamp',
        buyerSign: 'Second Party (Buyer)',
        live: 'Signature',
        e: '(Customer e-signature approved)',
      };

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        width: 794,
        background: '#ffffff',
        color: ink,
        padding: '34px 44px 40px',
        boxSizing: 'border-box',
        fontFamily: "'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif",
      }}
    >
      {/* الهيدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ textAlign: align }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png?v=2"
              alt=""
              style={{ height: 38, width: 38, borderRadius: '50%', objectFit: 'contain' }}
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
            <span style={{ fontSize: 22, fontWeight: 800, color: accent }}>
              {storeAr} | {storeEn.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#444', marginTop: 4 }}>{T.sub}</div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.8, textAlign: ar ? 'left' : 'right', direction: 'ltr', whiteSpace: 'nowrap' }}>
          <div>
            <b>{T.no}:</b> {contractNo}
          </div>
          <div>
            <b>{T.date}:</b> {dateText}
          </div>
        </div>
      </div>
      <div style={{ height: 3, background: gold, margin: '10px 0 14px' }} />

      <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, textDecoration: 'underline', margin: '6px 0 12px' }}>
        {T.title}
      </div>

      {/* الأطراف */}
      <div style={{ border: '1px solid #cfd6df', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
        <p style={p}>
          <b>{T.first}:</b> {sellerName}
          {ar ? '، الكائن مقرها بمملكة البحرين.' : ', based in the Kingdom of Bahrain.'}
          {settings.cr_number ? (ar ? ` (سجل تجاري رقم ${settings.cr_number})` : ` (CR No. ${settings.cr_number})`) : ''}
        </p>
        <p style={p}>
          <b>{T.second}:</b> {buyer} | <b>{T.cpr}:</b> {cpr}
        </p>
        <p style={p}>
          <b>{T.phone}:</b> <span dir="ltr">{phone}</span> | <b>{T.addr}:</b> {address}
        </p>
      </div>

      {/* التمهيد */}
      <p style={{ ...p, fontSize: 11.5, lineHeight: 1.85 }}>
        {ar ? (
          <>
            <b>التمهيد:</b> لما كان الطرف الأول يمارس نشاط بيع وتوزيع الأجهزة الإلكترونية والهواتف الذكية بالتقسيط الميسر،
            وقد أبدى الطرف الثاني رغبته التامة في شراء الجهاز الموضح أدناه وفق المواصفات المحددة، على أن تتم المعاينة
            والفحص والتأكد من سلامته ومطابقته عند التسليم النهائي، وقبوله لجدول السداد الشهري، فقد اتفق الطرفان بكامل
            الأهلية المعتبرة على البنود التالية:
          </>
        ) : (
          <>
            <b>Preamble:</b> Whereas the First Party is engaged in selling and distributing electronic devices and
            smartphones on easy installments, and the Second Party has expressed his full desire to purchase the device
            described below according to the stated specifications, subject to inspection, examination and verification
            of its soundness and conformity upon final delivery, and has accepted the monthly payment schedule, the
            parties, with full legal capacity, have agreed on the following terms:
          </>
        )}
      </p>

      {/* البند 1 */}
      <div style={h}>{T.c1}</div>
      <p style={p}>
        {ar ? (
          <>
            باع الطرف الأول للطرف الثاني الجهاز: <b>{device || '—'}</b>، مشمولاً بضمان الوكيل المعتمد لمدة {warranty}.
            يلتزم الطرف الأول بتسليم الجهاز للطرف الثاني جديداً ومطابقاً للمواصفات المعتمدة، ويلتزم الطرف الثاني
            بمعاينته وتأكيد استلامه فور التوصيل.
          </>
        ) : (
          <>
            The First Party sold to the Second Party the device: <b>{device || '—'}</b>, covered by the authorized
            agent&apos;s warranty for {warranty}. The First Party shall deliver the device new and conforming to the
            approved specifications, and the Second Party shall inspect it and confirm receipt immediately upon
            delivery.
          </>
        )}
      </p>

      {/* البند 2 */}
      <div style={h}>{T.c2}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
        <thead>
          <tr>
            {T.th.map((x) => (
              <th key={x} style={thStyle}>
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>{formatCurrency3(total, lang)}</td>
            <td style={tdStyle}>{formatCurrency3(down, lang)}</td>
            <td style={tdStyle}>{formatCurrency3(remaining, lang)}</td>
            <td style={tdStyle}>{T.monthsLabel}</td>
            <td style={{ ...tdStyle, fontWeight: 800, color: accent }}>{formatCurrency3(monthly, lang)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ ...p, fontSize: 11, lineHeight: 1.7, color: '#444' }}>
        {ar
          ? `* يستحق القسط الأول في تاريخ ${firstDate}، وتستحق الأقساط اللاحقة في نفس اليوم من كل شهر ميلادي بصورة دورية ومنتظمة عبر وسائل الدفع المعتمدة لدى الطرف الأول (${payApp}).`
          : `* The first installment is due on ${firstDate}, and subsequent installments are due on the same day of each Gregorian month, regularly and continuously, through the payment methods approved by the First Party (${payApp}).`}
      </p>

      {/* البند 3 */}
      <div style={h}>{T.c3}</div>
      <p style={p}>
        {ar
          ? 'يقر الطرف الثاني (المشتري) إقراراً صريحاً لا رجعة فيه بانشغال ذمته بالمبلغ المتبقي لصالح الطرف الأول، ويتعهد بالالتزام التام بسداد الأقساط الشهرية في مواعيد استحقاقها المحددة.'
          : 'The Second Party (Buyer) expressly and irrevocably acknowledges that he is indebted to the First Party for the remaining amount, and undertakes to fully comply with paying the monthly installments on their due dates.'}
      </p>

      {/* البند 4 */}
      <div style={h}>{T.c4}</div>
      <p style={p}>
        {ar ? (
          <>
            اتفق الطرفان تراضياً على أنه في حال تأخر الطرف الثاني عن سداد الأقساط المستحقة لمدة تتجاوز{' '}
            <b>{lateWordsAr}</b>، يتم احتساب وإضافة <b>رسوم تأخير ومتابعة إدارية</b> قدرها <b>({feeText} د.ب)</b>{' '}
            {feeWordsAr} تضاف إلى رصيد الحساب عن كل شهر تأخير إضافي حتى تمام السداد وتسوية المبالغ المستحقة.
          </>
        ) : (
          <>
            The parties mutually agreed that if the Second Party delays paying due installments for more than{' '}
            <b>{lateWordsEn}</b>, a <b>late payment and administrative follow-up fee</b> of{' '}
            <b>(BHD {feeText})</b>
            {feeWordsEn ? ` (${feeWordsEn})` : ''} shall be calculated and added to the account balance for each
            additional month of delay until full payment and settlement of all dues.
          </>
        )}
      </p>

      {/* البند 5 */}
      <div style={h}>{T.c5}</div>
      <p style={p}>
        {ar
          ? 'تعتبر العناوين وأرقام الهواتف وبيانات تطبيق الواتساب الموضحة في صدر هذا العقد معتمدة وموثقة لتبادل التذكيرات الشهرية والإشعارات الخاصة بمواعيد السداد وإيصالات الدفع.'
          : 'The addresses, phone numbers and WhatsApp details stated at the head of this contract are deemed valid and documented for exchanging monthly reminders, payment-due notices and payment receipts.'}
      </p>

      {/* شروط إضافية من الإعدادات (لو موجودة) */}
      {extraTerms && extraTerms.trim() && (
        <>
          <div style={h}>{T.c6}</div>
          <p style={{ ...p, whiteSpace: 'pre-line' }}>{extraTerms}</p>
        </>
      )}

      {/* التوقيعات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, gap: 24 }}>
        <div style={{ flex: 1, textAlign: align }}>
          <p style={{ ...p, margin: 0 }}>
            <b>{T.sellerSign}:</b> {sellerName}
          </p>
          <p style={{ ...p, margin: '4px 0 8px' }}>
            <b>{T.sealSign}:</b> ........................................
          </p>
          <Seal name={storeName} />
        </div>
        <div style={{ flex: 1, textAlign: align }}>
          <p style={{ ...p, margin: 0 }}>
            <b>{T.buyerSign}:</b> {buyer}
          </p>
          <p style={{ ...p, margin: '4px 0 8px' }}>
            <b>{T.live}:</b>
          </p>
          <p style={{ ...p, fontSize: 11, color: '#444', margin: '28px 0 4px' }}>{T.e}</p>
          <div style={{ borderTop: '1.5px solid #333', width: '100%', marginTop: 28 }} />
        </div>
      </div>
    </div>
  );
}
