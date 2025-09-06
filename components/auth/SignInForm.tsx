'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/provider';

type SignInFormData = {
  email: string;
  password: string;
};

interface SignInFormProps {
  onToggleMode?: () => void;
  onForgotPassword?: () => void;
}

export function SignInForm({ onToggleMode, onForgotPassword }: SignInFormProps) {
  const { signIn, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n();

  const signInSchema = z.object({
    email: z.string().email(t('auth.validation.email') || 'Please enter a valid email address'),
    password: z.string().min(6, t('auth.validation.passwordMin') || 'Password must be at least 6 characters'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    const result = await signIn(data);
    
    if (result.success) {
      toast.success(t('auth.toasts.welcomeBack') || 'Welcome back!');
      reset();
    } else {
      toast.error(result.error || t('auth.toasts.signInFailed') || 'Failed to sign in');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth.signin.title') || 'Sign In'}</CardTitle>
        <CardDescription>
          {t('auth.signin.description') || 'Enter your email and password to access your account'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email.label') || 'Email'}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.email.placeholder') || 'Enter your email'}
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password.label') || 'Password'}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.password.placeholder') || 'Enter your password'}
                {...register('password')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (t('auth.signin.submitting') || 'Signing in...') : (t('auth.signin.submit') || 'Sign In')}
          </Button>
          <div className="flex flex-col space-y-2 text-sm text-center">
            {onForgotPassword && (
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={onForgotPassword}
              >
                {t('auth.signin.forgot') || 'Forgot your password?'}
              </Button>
            )}
            {onToggleMode && (
              <div className="text-muted-foreground">
                {t('auth.signin.noAccountPrefix') || "Don't have an account?"}{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={onToggleMode}
                >
                  {t('auth.signin.noAccountLink') || 'Sign up'}
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
