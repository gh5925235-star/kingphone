import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '@/context/LanguageContext';
import { useSeo } from '@/components/Seo';

export function NotFoundPage() {
  const { t } = useLang();
  useSeo({ title: '404' });
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="text-7xl font-bold text-gold-gradient">404</p>
      <p className="text-lg text-white/60">{t('error.generic')}</p>
      <Link to="/" className="btn-gold">
        <Home size={18} /> {t('cta.backHome')}
      </Link>
    </div>
  );
}
