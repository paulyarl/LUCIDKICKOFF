import { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '../../../components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a new account',
};

export default function SignupPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create an account
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your information to create an account
      </p>
      
      <SignupForm className="pt-4" />
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="hover:text-brand underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
