'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';

function getEnv(name: string) {
  if (typeof window === 'undefined') return '';
  // NEXT_PUBLIC_* are exposed at build-time. This is fine for dev-only convenience.
  // These should only be used for prefill, not hardcoded secrets.
  // @ts-ignore
  return process.env[name] || '';
}

export default function DevImpersonatePage() {
  const isDev = process.env.NODE_ENV === 'development';
  const { t } = useI18n();

  if (!isDev) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold mb-2">{t('dev.impersonate.disabled.title')}</h1>
        <p className="text-muted-foreground">{t('dev.impersonate.disabled.desc')}</p>
      </div>
    );
  }

  return <DevOnlyImpersonate />;
}

function DevOnlyImpersonate() {
  const { signIn, isLoading } = useAuth();
  const { t } = useI18n();

  const presets = useMemo(() => ({
    admin: {
      email: getEnv('NEXT_PUBLIC_DEMO_ADMIN_EMAIL'),
      password: getEnv('NEXT_PUBLIC_DEMO_ADMIN_PASSWORD'),
    },
    parent: {
      email: getEnv('NEXT_PUBLIC_DEMO_PARENT_EMAIL'),
      password: getEnv('NEXT_PUBLIC_DEMO_PARENT_PASSWORD'),
    },
    child: {
      email: getEnv('NEXT_PUBLIC_DEMO_CHILD_EMAIL'),
      password: getEnv('NEXT_PUBLIC_DEMO_CHILD_PASSWORD'),
    },
  }), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await signIn({ email, password });
    if (!res.success) setMessage(res.error || t('auth.toasts.signInFailed'));
  }

  function loadPreset(role: keyof typeof presets) {
    setEmail(presets[role].email || '');
    setPassword(presets[role].password || '');
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('dev.impersonate.pageTitle')}</h1>

      <div className="flex gap-2 mb-4">
        <Button type="button" variant="secondary" onClick={() => loadPreset('admin')}>{t('dev.impersonate.load.admin')}</Button>
        <Button type="button" variant="secondary" onClick={() => loadPreset('parent')}>{t('dev.impersonate.load.parent')}</Button>
        <Button type="button" variant="secondary" onClick={() => loadPreset('child')}>{t('dev.impersonate.load.child')}</Button>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.email.label')}</label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email.placeholder')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.password.label')}</label>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password.placeholder')}
            required
          />
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('auth.signin.submitting') : t('auth.signin.submit')}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground mt-4">
        {t('dev.impersonate.note')}
      </p>
    </div>
  );
}
