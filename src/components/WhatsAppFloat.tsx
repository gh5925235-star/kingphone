import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useLang } from '@/context/LanguageContext';

export function WhatsAppFloat() {
  const { settings } = useSettings();
  const { t } = useLang();
  const number = settings?.whatsappNumber;
  if (!number) return null;
  const href = `https://wa.me/${number.replace(/\D/g, '')}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp.contact')}
      className="group fixed bottom-5 end-5 z-30 flex items-center gap-2 rounded-full bg-gold-gradient p-3.5 text-ink-950 shadow-gold-lg transition-all duration-300 hover:scale-105"
    >
      <MessageCircle size={24} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[160px]">
        {t('whatsapp.contact')}
      </span>
    </a>
  );
}
