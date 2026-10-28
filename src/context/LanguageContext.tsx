import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LANG, applyDir, getStoredLang, storeLang, tr, type DictKey, type Lang } from '@/lib/i18n';

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
};

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang());

  useEffect(() => {
    applyDir(lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    storeLang(l);
    applyDir(l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => tr(lang, key, vars),
    [lang],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, toggle, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }),
    [lang, setLang, toggle, t],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
