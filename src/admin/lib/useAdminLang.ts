import { useLang } from '@/context/LanguageContext';
import { adminTr } from '@/admin/lib/adminI18n';

// Convenience hook for admin: returns lang + a t() bound to the admin dictionary.
export function useAdminLang() {
  const { lang, setLang, toggle, dir } = useLang();
  const t = (key: string, vars?: Record<string, string | number>) => adminTr(lang, key, vars);
  return { lang, setLang, toggle, dir, t };
}
