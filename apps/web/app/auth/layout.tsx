import { Metadata } from 'next';
import { AuthProvider } from '../../components/auth/AuthProvider';
import { ArtImage } from '@/components/frame/ArtImage';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in to LucidCraft',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-navy">
      <AuthProvider>
        <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
          <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
            <ArtImage
              id="hero.savanna"
              className="absolute inset-0 h-full w-full object-cover opacity-45"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/30 via-brand-cream/60 to-brand-cream" />
            <div className="relative z-20 flex items-center gap-2 p-10 text-lg font-heading font-bold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              LucidCraft
            </div>
            <div className="relative z-20 mt-auto p-10">
              <blockquote className="space-y-2">
                <p className="text-lg font-heading font-semibold">
                  A fun and creative way to color, learn, and explore Tanzania
                  and the world around you.
                </p>
                <footer className="text-sm text-brand-navy/60">
                  Child-safe · Parent managed · Privacy first
                </footer>
              </blockquote>
            </div>
          </div>
          <div className="force-light p-6 lg:p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 rounded-2xl bg-white p-6 shadow-soft sm:w-[380px] sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </AuthProvider>
    </div>
  );
}
