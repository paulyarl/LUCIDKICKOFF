'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { FormInput } from './FormInput';
import { toast } from 'sonner';

const signupFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
  role: z.enum(['parent', 'child']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'parent',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        firstName: data.username, // Using username as firstName for now
        role: data.role,
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Sign up failed');
      }
      
      toast.success('Account created successfully! Please check your email to confirm your account.');
      router.push('/auth/verify-email');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during sign up');
      toast.error('Sign up failed', {
        description: error.message || 'Please check your information and try again.',
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
        
        <FormInput
          id="username"
          type="text"
          label="Username"
          placeholder="yourusername"
          error={errors.username?.message}
          leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
          disabled={isLoading}
          {...register('username')}
        />
        
        <FormInput
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
          disabled={isLoading}
          {...register('password')}
        />
        
        <FormInput
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
          disabled={isLoading}
          {...register('confirmPassword')}
        />

        <div className="text-left">
          <label className="block text-sm font-medium mb-2">I am signing up as</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                value="parent"
                className="h-4 w-4"
                {...register('role')}
                disabled={isLoading}
              />
              <span>Parent</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                value="child"
                className="h-4 w-4"
                {...register('role')}
                disabled={isLoading}
              />
              <span>Child</span>
            </label>
          </div>
          {errors.role?.message && (
            <p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>
        
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
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create account
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-background text-muted-foreground">
            Or sign up with
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
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="underline hover:text-primary"
          tabIndex={-1}
        >
          Sign in
        </button>
      </p>
      
      <p className="px-8 text-xs text-center text-muted-foreground">
        By signing up, you agree to our{' '}
        <a href="/terms" className="underline hover:text-primary">Terms of Service</a> and{' '}
        <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
      </p>
    </div>
  );
}

