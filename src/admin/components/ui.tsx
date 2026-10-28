import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Inbox } from 'lucide-react';

export function AdminLoading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-white/50">
      <Loader2 size={20} className="animate-spin text-gold-300" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function AdminEmpty({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/45">
      <Inbox size={32} className="text-gold-300/40" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <AlertTriangle size={28} className="text-red-400" />
      <p className="max-w-md text-sm text-white/70">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-2">
          إعادة المحاولة · Retry
        </button>
      )}
    </div>
  );
}

type ToastKind = 'success' | 'error' | 'info';
export type AdminToast = { id: number; kind: ToastKind; message: string };

export function ToastStack({ toasts, dismiss }: { toasts: AdminToast[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-card animate-fade-in ${
            t.kind === 'success'
              ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
              : t.kind === 'error'
                ? 'border-red-400/30 bg-red-500/15 text-red-100'
                : 'border-gold-300/30 bg-gold-300/10 text-gold-100'
          }`}
          onClick={() => dismiss(t.id)}
        >
          {t.kind === 'success' && <CheckCircle2 size={16} />}
          {t.kind === 'error' && <AlertTriangle size={16} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        className="card w-full max-w-sm p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
        <p className="mb-6 text-sm text-white/60">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-gold-gradient text-ink-950 hover:brightness-105'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none rounded-t-2xl p-5 animate-scale-in sm:rounded-2xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>
        <div className="mb-4">{children}</div>
        {footer && <div className="flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
