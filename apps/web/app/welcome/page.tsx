import Link from "next/link";
import { LogIn, UserPlus, Users } from "lucide-react";
import { T } from "@/components/i18n/T";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Icons } from "@/components/icons";
import { ArtImage } from "@/components/frame/ArtImage";
import { TrustedLearnerChips } from "@/components/welcome/TrustedLearnerChips";
import { StartExploring } from "@/components/welcome/StartExploring";
import { AdminSignInLink } from "@/components/welcome/AdminSignInLink";

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-cream text-brand-navy">
      <ArtImage
        id="hero.savanna"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/40 via-brand-cream/70 to-brand-cream" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-2 py-1 text-brand-navy/80 transition hover:text-brand-navy"
            aria-label="LucidCraft"
          >
            <Icons.palette className="h-6 w-6 text-brand-teal" aria-hidden="true" />
            <span className="font-heading text-sm font-bold">
              <T k="app.title" />
            </span>
          </Link>
          <LanguageSwitcher iconTrigger />
        </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="font-heading text-5xl font-bold leading-tight"><T k="welcome.title" /></h1>
        <p className="mt-3 max-w-xl text-base text-brand-navy/70">
          <T k="welcome.tagline" />
        </p>

        <TrustedLearnerChips />

        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-3">
          <div className="flex flex-wrap justify-center gap-3">
            <StartExploring />
            <Link
              href="/learners"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-ochre px-6 py-3 text-sm font-bold text-brand-navy shadow-soft"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <T k="welcome.cta.chooseLearner" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand-navy shadow-soft"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <T k="welcome.cta.parentSignIn" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-soft"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <T k="welcome.cta.createFamily" />
            </Link>
          </div>
        </div>

      </div>

        <footer className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold text-brand-navy/45">
            <T k="welcome.trustLine" />
          </p>
          <AdminSignInLink />
        </footer>
      </div>
    </main>
  );
}
