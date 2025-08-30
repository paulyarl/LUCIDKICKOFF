'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '../ui/button';
import { FormInput } from '../ui/form-input';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/provider';

// schema moved inside component to use i18n

type ForgotPasswordFormValues = { email: string };

export function ForgotPasswordForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { resetPassword } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const forgotPasswordSchema = React.useMemo(
    () =>
      z.object({
        email: z
          .string()
          .email(t('auth.validation.email') || 'Please enter a valid email address'),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      toast.success(t('auth.toasts.resetSentTitle') || 'Password reset email sent!', {
        description: t('auth.toasts.resetSentDesc') || 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || t('auth.toasts.resetFailedDesc') || 'An error occurred while sending the reset email');
      toast.error(t('auth.toasts.resetFailedTitle') || 'Failed to send reset email', {
        description: error.message || t('auth.toasts.resetFailedDesc') || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn('text-center', className)} {...props}>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('auth.forgot.sentTitle') || 'Check your email'}</h2>
        <p className="text-muted-foreground mb-6">
          {t('auth.forgot.sentDescription') || "We've sent a password reset link to your email address."}
        </p>
        <Button 
          onClick={() => router.push('/auth/login')} 
          className="w-full"
        >
          {t('auth.forgot.backToSignIn') || 'Back to sign in'}
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          {t('auth.forgot.noEmailPrefix') || "Didn't receive an email?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setError(null);
            }}
            className="font-medium text-primary hover:underline"
          >
            {t('auth.forgot.tryAgain') || 'Try again'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t('auth.forgot.header') || 'Forgot your password?'}</h2>
        <p className="text-muted-foreground">
          {t('auth.forgot.description') || "Enter your email and we'll send you a link to reset your password."}
        </p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          id="email"
          type="email"
          label={t('auth.email.label') || 'Email address'}
          placeholder={t('auth.email.example') || 'you@example.com'}
          error={errors.email?.message}
          leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
          disabled={isLoading}
          {...register('email')}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('auth.forgot.submit') || 'Send reset link'}
        </Button>
      </form>
      
      <p className="px-8 text-sm text-center text-muted-foreground">
        {t('auth.forgot.rememberPrefix') || 'Remember your password?'}{' '}
        <Button
          variant="ghost"
          size="sm"
          className="px-0 font-normal text-primary hover:text-primary/80"
          onClick={() => router.back()}
        >
          {t('auth.forgot.backToSignIn') || 'Back to sign in'}
        </Button>
      </p>
    </div>
  );
}
