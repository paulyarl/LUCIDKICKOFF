'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Lock, AlertCircle, CheckCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { FormInput } from './FormInput';
import { toast } from 'sonner';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { updatePassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError('Invalid or expired reset token');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await updatePassword(data.password);
      
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      toast.success('Password updated!', {
        description: 'Your password has been successfully updated.',
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'An error occurred while resetting your password');
      toast.error('Failed to reset password', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={cn('text-center', className)} {...props}>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-destructive/10">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Invalid or expired link</h2>
        <p className="text-muted-foreground mb-6">
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        <Button 
          onClick={() => router.push('/auth/forgot-password')} 
          className="w-full"
        >
          Request new reset link
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={cn('text-center', className)} {...props}>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Password updated!</h2>
        <p className="text-muted-foreground">
          Your password has been successfully updated. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Create new password</h2>
        <p className="text-muted-foreground">
          Your new password must be different from previous used passwords.
        </p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <FormInput
            id="password"
            type="password"
            label="New password"
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
            disabled={isLoading}
            {...register('password')}
          />
          
          <FormInput
            id="confirmPassword"
            type="password"
            label="Confirm new password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          
          <div className="p-4 text-sm rounded-md bg-muted/50">
            <p className="font-medium">Password requirements:</p>
            <ul className="mt-1 ml-4 list-disc">
              <li className={errors.password?.types?.minLength ? 'text-destructive' : 'text-muted-foreground'}>
                At least 8 characters
              </li>
              <li className={errors.password?.message?.includes('uppercase') ? 'text-destructive' : 'text-muted-foreground'}>
                At least one uppercase letter
              </li>
              <li className={errors.password?.message?.includes('lowercase') ? 'text-destructive' : 'text-muted-foreground'}>
                At least one lowercase letter
              </li>
              <li className={errors.password?.message?.includes('number') ? 'text-destructive' : 'text-muted-foreground'}>
                At least one number
              </li>
            </ul>
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Reset password
        </Button>
      </form>
      
      <p className="px-8 text-sm text-center text-muted-foreground">
        Remember your password?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="font-medium text-primary hover:underline"
          tabIndex={-1}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
