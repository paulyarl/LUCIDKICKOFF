import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '../../../components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and password to sign in to your account
      </p>
      
      <LoginForm className="pt-4" />
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/auth/forgot-password"
          className="hover:text-brand underline underline-offset-4"
        >
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
