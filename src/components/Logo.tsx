import { useState } from 'react';
import { Crown } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, { box: string; icon: number; text: string; sub: string }> = {
  sm: { box: 'h-8 w-8', icon: 16, text: 'text-sm', sub: 'text-[10px]' },
  md: { box: 'h-11 w-11', icon: 22, text: 'text-base', sub: 'text-[11px]' },
  lg: { box: 'h-16 w-16', icon: 34, text: 'text-xl', sub: 'text-xs' },
};

// اللوجو بيتقرا من public/logo.png
// لو الملف مش موجود بيظهر التاج بدالو.
export function Logo({ size = 'md', showText = true }: { size?: Size; showText?: boolean }) {
  const s = sizes[size];
  const [hasImg, setHasImg] = useState(true);

  return (
    <span className="flex items-center gap-3">
      <span
        className={`relative ${s.box} flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
          hasImg ? 'border border-white/10 bg-ink-900 shadow-card' : 'bg-gold-gradient shadow-gold'
        }`}
      >
        {hasImg ? (
          <img
            src="/logo.png"
            alt="King Phone"
            className="h-full w-full object-contain p-1"
            onError={() => setHasImg(false)}
          />
        ) : (
          <Crown size={s.icon} className="pointer-events-none text-ink-950" aria-hidden />
        )}
      </span>
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className={`${s.text} font-bold tracking-wide text-gold-gradient`}>KING PHONE</span>
          <span className={`${s.sub} font-medium uppercase tracking-[0.15em] text-white/50`}>
            iPhone Specialist · Bahrain
          </span>
        </span>
      )}
    </span>
  );
}
