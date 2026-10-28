import { Crown } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, { box: string; icon: number; text: string; sub: string }> = {
  sm: { box: 'h-8 w-8', icon: 16, text: 'text-sm', sub: 'text-[10px]' },
  md: { box: 'h-11 w-11', icon: 22, text: 'text-base', sub: 'text-[11px]' },
  lg: { box: 'h-16 w-16', icon: 34, text: 'text-xl', sub: 'text-xs' },
};

export function Logo({ size = 'md', showText = true }: { size?: Size; showText?: boolean }) {
  const s = sizes[size];
  return (
    <span className="flex items-center gap-3">
      <span
        className={`relative ${s.box} flex shrink-0 items-center justify-center rounded-full bg-gold-gradient shadow-gold`}
      >
        <img
          src="/logo.png"
          alt="King Phone"
          className="h-full w-full rounded-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <Crown
          size={s.icon}
          className="absolute text-ink-950 pointer-events-none"
          aria-hidden
        />
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
