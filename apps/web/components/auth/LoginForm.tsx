'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { FormInput } from './FormInput';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully logged in!');
      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('grid gap-6', className)} {...props}>
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
          label="Email address"
          placeholder="you@example.com"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
          disabled={isLoading}
          {...register('email')}
        />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              Password
            </label>
            <button
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-xs text-muted-foreground hover:underline"
              tabIndex={-1}
            >
              Forgot password?
            </button>
          </div>
          <FormInput
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
            disabled={isLoading}
            {...register('password')}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Sign in
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-background text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" disabled={isLoading}>
          <svg
            className="w-4 h-4 mr-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 22a10 10 0 0 1-7.1-3A9.9 9.9 0 0 1 5 4.8C7 3 9.5 2 12.2 2h.2c2.4 0 4.8.9 6.7 2.6l-2.5 2.3a6.2 6.2 0 0 0-4.2-1.6c-1.8 0-3.5.7-4.8 2a6.6 6.6 0 0 0-.1 9.3c1.2 1.2 2.9 2 4.7 2h.1a6 6 0 0 0 4-1.1c1-.9 1.8-2 2.1-3.4v-.2h-6v-3.4h9.6l.1 1.5c.1 6.8-2.5 10.4-9.7 10.4h-.2Z"
              clipRule="evenodd"
            />
          </svg>
          Google
        </Button>
        <Button variant="outline" type="button" disabled={isLoading}>
          <svg
            className="w-4 h-4 mr-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 0C4.5 0 0 4.5 0 10c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.9.1-.7.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.6 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.6 4.9.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.5C20 4.5 15.5 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          GitHub
        </Button>
      </div>
      
      <p className="px-8 text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/signup')}
          className="underline hover:text-primary"
          tabIndex={-1}
        >
          Sign up
        </button>
      </p>
    </div>
  );
}
