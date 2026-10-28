import { AlertTriangle, PackageSearch, RefreshCw } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="shimmer aspect-square w-full bg-ink-900" />
      <div className="space-y-3 p-4">
        <div className="shimmer h-3 w-1/3 rounded bg-ink-700" />
        <div className="shimmer h-4 w-2/3 rounded bg-ink-700" />
        <div className="shimmer h-5 w-1/2 rounded bg-ink-700" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-white/60">
      <RefreshCw size={18} className="animate-spin text-gold-300" />
      <span>{label ?? t('loading')}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center animate-scale-in">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <AlertTriangle size={24} />
      </span>
      <p className="text-sm text-white/70">{message ?? t('error.generic')}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost">
          <RefreshCw size={16} /> {t('error.tryAgain')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { t } = useLang();
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center animate-scale-in">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-300/10 text-gold-300">
        <PackageSearch size={24} />
      </span>
      <p className="text-base font-semibold text-white">{title ?? t('empty.title')}</p>
      <p className="text-sm text-white/60">{subtitle ?? t('empty.subtitle')}</p>
    </div>
  );
}
