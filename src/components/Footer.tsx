import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useLang } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';

export function Footer() {
  const { lang, t } = useLang();
  const { settings } = useSettings();
  const about = lang === 'ar' ? settings?.aboutAr : settings?.aboutEn;
  const hours = lang === 'ar' ? settings?.workingHoursAr : settings?.workingHoursEn;
  const waNumber = settings?.whatsappNumber?.replace(/\D/g, '') ?? '';

  return (
    <footer className="mt-20 border-t border-white/5 bg-ink-900">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo size="md" showText />
          <p className="text-sm leading-relaxed text-white/55">{about}</p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">{t('footer.quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="text-white/60 transition-colors hover:text-gold-200">
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link to="/c/iphone" className="text-white/60 transition-colors hover:text-gold-200">
                iPhone
              </Link>
            </li>
            <li>
              <Link to="/c/ipad" className="text-white/60 transition-colors hover:text-gold-200">
                iPad
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="text-white/60 transition-colors hover:text-gold-200">
                {t('cta.checkout')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">{t('footer.contact')}</h3>
          <ul className="space-y-3 text-sm text-white/60">
            {settings?.storePhone && (
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gold-300" />
                <a href={`tel:${settings.storePhone}`} dir="ltr" className="hover:text-gold-200">
                  {settings.storePhone}
                </a>
              </li>
            )}
            {settings?.storeAddress && (
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-gold-300" />
                <span>{settings.storeAddress}</span>
              </li>
            )}
            {waNumber && (
              <li className="flex items-center gap-2">
                <MessageCircle size={16} className="text-gold-300" />
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="hover:text-gold-200"
                >
                  +{waNumber}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">{t('footer.hours')}</h3>
          <p className="flex items-start gap-2 text-sm text-white/60">
            <Clock size={16} className="mt-0.5 text-gold-300" />
            <span>{hours || '—'}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-white/5 py-5">
        <div className="container-page text-center text-xs text-white/40">
          {t('footer.rights')} · {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
