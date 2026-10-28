import { supabase } from '@/lib/supabase';
import type { AdminSettings } from '@/admin/lib/types';

export async function fetchSettings(): Promise<AdminSettings> {
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) throw error;
  const map: AdminSettings = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function saveSettings(settings: AdminSettings): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('settings')
    .upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

// Settings keys the admin panel manages, grouped for the form.
export type SettingsField = {
  key: string;
  type: 'text' | 'textarea' | 'number';
  group: 'store' | 'contact' | 'payment' | 'about';
};

export const SETTINGS_FIELDS: SettingsField[] = [
  { key: 'store_name_ar', type: 'text', group: 'store' },
  { key: 'store_name_en', type: 'text', group: 'store' },
  { key: 'store_address', type: 'text', group: 'store' },
  { key: 'cr_number', type: 'text', group: 'store' },
  { key: 'currency', type: 'text', group: 'store' },
  { key: 'vat_percent', type: 'number', group: 'store' },
  { key: 'default_months', type: 'text', group: 'payment' },
  { key: 'min_down_payment_percent', type: 'number', group: 'payment' },
  { key: 'benefit_payment_link', type: 'text', group: 'payment' },
  { key: 'contract_terms_ar', type: 'textarea', group: 'payment' },
  { key: 'contract_terms_en', type: 'textarea', group: 'payment' },
  { key: 'store_phone', type: 'text', group: 'contact' },
  { key: 'whatsapp_number', type: 'text', group: 'contact' },
  { key: 'working_hours_ar', type: 'text', group: 'contact' },
  { key: 'working_hours_en', type: 'text', group: 'contact' },
  { key: 'about_ar', type: 'textarea', group: 'about' },
  { key: 'about_en', type: 'textarea', group: 'about' },
];
