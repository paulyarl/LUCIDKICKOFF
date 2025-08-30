import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '../../../components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Forgot your password?
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a link to reset your password
      </p>
      
      <ForgotPasswordForm className="pt-4" />
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="hover:text-brand underline underline-offset-4"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
