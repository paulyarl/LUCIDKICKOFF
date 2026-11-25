import { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '../../../components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your account',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Reset your password
      </h1>
      <p className="text-sm text-brand-navy/60">
        Enter a new password for your account
      </p>
      
      <ResetPasswordForm className="pt-4" />
      
      <p className="px-8 text-center text-sm text-brand-navy/60">
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
