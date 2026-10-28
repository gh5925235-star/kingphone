import type { ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';
import type { AdminSettings } from '@/admin/lib/types';

// A4-styled document chrome for PDF export. White background, black text,
// gold accent line. Uses inline styles so html2canvas renders consistently.

export type DocSettings = {
  storeNameAr: string;
  storeNameEn: string;
  storePhone: string;
  storeAddress: string;
  crNumber: string;
  currency: string;
};

export function docSettingsFrom(settings: AdminSettings): DocSettings {
  return {
    storeNameAr: settings.store_name_ar || 'كنج للهواتف',
    storeNameEn: settings.store_name_en || 'King Phone',
    storePhone: settings.store_phone || '',
    storeAddress: settings.store_address || '',
    crNumber: settings.cr_number || '',
    currency: settings.currency || 'BHD',
  };
}

export function DocPage({
  lang,
  title,
  docNumber,
  date,
  settings,
  children,
}: {
  lang: Lang;
  title: string;
  docNumber: string;
  date: string;
  settings: DocSettings;
  children: ReactNode;
}) {
  const isAr = lang === 'ar';
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#ffffff',
        color: '#111111',
        fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
        padding: '18mm 16mm',
        boxSizing: 'border-box',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <DocHeader lang={lang} title={title} docNumber={docNumber} date={date} settings={settings} />
      <div style={{ marginTop: 16 }}>{children}</div>
      <DocFooter lang={lang} />
    </div>
  );
}

function DocHeader({
  lang, title, docNumber, date, settings,
}: { lang: Lang; title: string; docNumber: string; date: string; settings: DocSettings }) {
  const isAr = lang === 'ar';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#b8860b' }}>
            {isAr ? settings.storeNameAr : settings.storeNameEn}
          </div>
          <div style={{ fontSize: 11, color: '#555' }}>{isAr ? settings.storeNameEn : settings.storeNameAr}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
            {settings.storePhone && <div>📞 {settings.storePhone}</div>}
            {settings.storeAddress && <div>📍 {settings.storeAddress}</div>}
            {settings.crNumber && <div>CR: {settings.crNumber}</div>}
          </div>
        </div>
        <div style={{ textAlign: isAr ? 'left' : 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{docNumber}</div>
          <div style={{ fontSize: 11, color: '#444' }}>{date}</div>
        </div>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg,#f5c542,#b8860b)', marginTop: 10, borderRadius: 2 }} />
    </div>
  );
}

function DocFooter({ lang }: { lang: Lang }) {
  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #eee', paddingTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <SignBox label={lang === 'ar' ? 'توقيع البائع' : 'Seller signature'} />
        <SignBox label={lang === 'ar' ? 'توقيع العميل' : 'Customer signature'} />
      </div>
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#888' }}>
        {lang === 'ar' ? 'شكراً لاختياركم كنج للهواتف' : 'Thank you for choosing King Phone'}
      </div>
    </div>
  );
}

function SignBox({ label }: { label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 24 }}>{label}</div>
      <div style={{ borderTop: '1px dashed #999', paddingTop: 4, fontSize: 10, color: '#aaa' }}>x</div>
    </div>
  );
}

export function DocTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 8 }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th
              key={i}
              style={{
                border: '1px solid #ddd',
                padding: '6px 8px',
                background: '#f8f5ee',
                textAlign: i === 0 ? 'start' : 'end',
                color: '#333',
                fontWeight: 600,
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  border: '1px solid #eee',
                  padding: '6px 8px',
                  textAlign: ci === 0 ? 'start' : 'end',
                  color: '#222',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      <span style={{ color: '#111', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function DocField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: '#777' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#111', borderBottom: '1px solid #ccc', paddingBottom: 2, minHeight: 16 }}>
        {value || '\u00A0'}
      </div>
    </div>
  );
}
