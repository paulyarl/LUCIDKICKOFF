import { Metadata } from 'next';
import Link from 'next/link';
import { VerifyEmailForm } from '../../../components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
};

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : '';

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {token ? 'Verifying your email' : 'Check your email'}
      </h1>
      
      <VerifyEmailForm className="pt-4" />
      
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
