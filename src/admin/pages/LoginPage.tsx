import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/admin/context/AuthContext';
import { useAdminLang } from '@/admin/lib/useAdminLang';

export function LoginPage() {
  const { signIn } = useAuth();
  const { lang, dir, t } = useAdminLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError(t('login.emailRequired'));
    if (!password) return setError(t('login.passwordRequired'));
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError(t('login.error'));
      return;
    }
    navigate('/admin');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4" dir={dir}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
            <Crown size={30} className="text-ink-950" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gold-gradient">{t('admin.brand')}</h1>
            <p className="mt-1 text-sm text-white/50">{t('login.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="label-field">{t('login.email')}</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field ps-9"
                dir="ltr"
                placeholder="owner@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="label-field">{t('login.password')}</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field ps-9"
                dir="ltr"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-gold w-full">
            {submitting ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30" dir="ltr">
          King Phone Admin · {lang === 'ar' ? 'البحرين' : 'Bahrain'}
        </p>
      </div>
    </div>
  );
}
