'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, AlertCircle, CheckCircle, RotateCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function VerifyEmailForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [status, setStatus] = React.useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = React.useState<string | null>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // In a real app, you would verify the token with your backend
  // This is a simplified example
  React.useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would send this token to your backend for verification
      // const response = await fetch('/api/auth/verify-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Verification failed');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would handle the verification response here
      setStatus('success');
      toast.success('Email verified successfully!');
      
      // Refresh user data to update email verification status
      // await user?.reload();
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      setStatus('error');
      setError(error.message || 'Failed to verify email. The link may be invalid or expired.');
      toast.error('Verification failed', {
        description: error.message || 'The verification link is invalid or has expired.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    setError(null);
    
    try {
      // In a real app, you would call your API to resend the verification email
      // const response = await fetch('/api/auth/resend-verification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: user.email }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Failed to resend verification email');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Verification email sent!', {
        description: 'Please check your inbox for the verification link.',
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      setError(error.message || 'Failed to resend verification email');
      toast.error('Failed to resend', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className={cn('text-center', className)} {...props}>
        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Verifying your email</h2>
        <p className="text-muted-foreground">
          Please wait while we verify your email address...
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={cn('text-center', className)} {...props}>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Email verified!</h2>
        <p className="text-muted-foreground mb-6">
          Your email has been successfully verified. You can now access all features.
        </p>
        <Button 
          onClick={() => router.push('/')} 
          className="w-full"
        >
          Continue to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('text-center', className)} {...props}>
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Verification failed</h2>
      
      {error && (
        <p className="text-muted-foreground mb-6">
          {error}
        </p>
      )}
      
      <div className="space-y-4">
        <Button 
          onClick={resendVerificationEmail} 
          className="w-full"
          disabled={isResending || !user?.email}
        >
          {isResending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4 mr-2" />
              Resend verification email
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.push('/')} 
          className="w-full"
        >
          Back to home
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={async () => {
            await signOut();
            router.push('/auth/login');
          }} 
          className="w-full"
        >
          Sign in with a different account
        </Button>
      </div>
    </div>
  );
}
