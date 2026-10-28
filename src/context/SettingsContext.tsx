import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase, type Settings } from '@/lib/supabase';
import { parseDefaultMonths } from '@/lib/format';

type PublicSettings = {
  raw: Settings;
  storeNameAr: string;
  storeNameEn: string;
  currency: string;
  vatPercent: number;
  benefitPaymentLink: string;
  whatsappNumber: string;
  storePhone: string;
  storeAddress: string;
  defaultMonths: number[];
  minDownPaymentPercent: number;
  workingHoursAr: string;
  workingHoursEn: string;
  aboutAr: string;
  aboutEn: string;
};

type SettingsContextValue = {
  settings: PublicSettings | null;
  loading: boolean;
  error: string | null;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function buildPublicSettings(raw: Settings): PublicSettings {
  return {
    raw,
    storeNameAr: raw.store_name_ar || 'كنج للهواتف',
    storeNameEn: raw.store_name_en || 'King Phone',
    currency: raw.currency || 'BHD',
    vatPercent: parseFloat(raw.vat_percent || '0') || 0,
    benefitPaymentLink: raw.benefit_payment_link || '',
    whatsappNumber: raw.whatsapp_number || '',
    storePhone: raw.store_phone || '',
    storeAddress: raw.store_address || '',
    defaultMonths: parseDefaultMonths(raw.default_months),
    minDownPaymentPercent: parseFloat(raw.min_down_payment_percent || '0') || 0,
    workingHoursAr: raw.working_hours_ar || '',
    workingHoursEn: raw.working_hours_en || '',
    aboutAr: raw.about_ar || '',
    aboutEn: raw.about_en || '',
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('settings').select('key, value');
      if (!active) return;
      if (error) {
        setError(error.message);
        setRaw({});
      } else {
        const map: Settings = {};
        for (const row of data ?? []) {
          map[row.key] = row.value;
        }
        setRaw(map);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const settings = raw ? buildPublicSettings(raw) : null;
    return { settings, loading, error };
  }, [raw, loading, error]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
