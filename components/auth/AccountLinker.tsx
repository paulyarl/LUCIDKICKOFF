'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { posthog } from 'posthog-js';

type AccountLinkerProps = {
  guestId: string;
  onSuccess?: () => void;
};

export function AccountLinker({ guestId, onSuccess }: AccountLinkerProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { linkGuestToUser } = useAuth();
  const router = useRouter();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await linkGuestToUser(email);
      
      // Track account linking attempt
      posthog.capture('cta_clicked', {
        type: 'link_account',
        method: 'email',
      });
      
      // Show success message
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error('Link account error:', err);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Link Your Account</h2>
        <p className="text-muted-foreground">
          To save your progress, please link your guest account to an email.
        </p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Parent's Email</Label>
          <Input
            id="email"
            placeholder="parent@example.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            We'll send a verification link to this email to confirm your identity.
          </p>
        </div>
        
        {error && (
          <div className="text-sm text-destructive">
            {error}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <Button disabled={isLoading} className="w-full">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send Verification Email
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/')}
          >
            Maybe Later
          </Button>
        </div>
      </form>
      
      <div className="text-xs text-muted-foreground text-center">
        By continuing, you agree to our{' '}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>.
      </div>
    </div>
  );
}
