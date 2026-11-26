import Link from "next/link";
import { LogIn, UserPlus, Users } from "lucide-react";
import { T } from "@/components/i18n/T";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
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
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher iconTrigger />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-heading text-5xl font-bold leading-tight"><T k="welcome.title" /></h1>
        <p className="mt-3 max-w-xl text-base text-brand-navy/70">
          <T k="welcome.tagline" />
        </p>

        <TrustedLearnerChips />

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <StartExploring />
          <Link
            href="/learners"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-ochre px-6 py-3 text-sm font-bold text-brand-navy shadow-soft"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <T k="welcome.cta.chooseLearner" />
          </Link>
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

        <p className="mt-8 text-xs font-semibold text-brand-navy/45">
          <T k="welcome.trustLine" />
        </p>
      </div>

      <AdminSignInLink />
    </main>
  );
}
