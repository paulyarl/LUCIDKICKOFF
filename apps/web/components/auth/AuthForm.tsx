'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { posthog } from 'posthog-js';
import { useI18n } from '../../../../lib/i18n/provider';

type AuthFormProps = {
  isSignUp?: boolean;
  onSuccess?: () => void;
};

export function AuthForm({ isSignUp = false, onSuccess }: AuthFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithEmail(email);
      
      // Track sign up/sign in attempt
      posthog.capture('cta_clicked', {
        type: isSignUp ? 'sign_up' : 'sign_in',
        method: 'email',
      });
      
      // Show success message
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error('Auth error:', err);
      setError(t('error.auth.magicLinkFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="email">
              {isSignUp ? t('auth.parentEmail') : t('auth.email')}
            </Label>
            <Input
              id="email"
              placeholder={t('auth.emailPlaceholder')}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('auth.parentEmailHint')}
              </p>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
          
          <Button disabled={isLoading} className="w-full" aria-busy={isLoading}>
            {isSignUp ? t('auth.signUp') : t('auth.signInWithEmail')}
          </Button>
        </div>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('auth.orContinueWith')}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          type="button" 
          disabled={isLoading}
          onClick={() => {
            posthog.capture('cta_clicked', {
              type: isSignUp ? 'sign_up' : 'sign_in',
              method: 'google',
            });
            // Implement Google OAuth
          }}
        >
          {t('auth.google')}
        </Button>
        <Button 
          variant="outline" 
          type="button" 
          disabled={isLoading}
          onClick={() => {
            posthog.capture('cta_clicked', {
              type: isSignUp ? 'sign_up' : 'sign_in',
              method: 'apple',
            });
            // Implement Apple OAuth
          }}
        >
          {t('auth.apple')}
        </Button>
      </div>
    </div>
  );
}
