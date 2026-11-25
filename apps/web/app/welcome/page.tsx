import Link from "next/link";
import { Shield } from "lucide-react";
import { ArtImage } from "@/components/frame/ArtImage";

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

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-heading text-5xl font-bold leading-tight">Welcome to LucidCraft</h1>
        <p className="mt-3 max-w-xl text-base text-brand-navy/70">
          A fun and creative way to color, learn, and explore Tanzania and the world around you.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/frame/home"
            className="rounded-2xl bg-brand-teal px-6 py-3 text-sm font-bold text-white shadow-soft"
          >
            ▶ Start Exploring
          </Link>
          <Link
            href="/learners"
            className="rounded-2xl bg-brand-ochre px-6 py-3 text-sm font-bold text-brand-navy shadow-soft"
          >
            Choose a Learner
          </Link>
          <Link
            href="/auth/login"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand-navy shadow-soft"
          >
            Parent Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-2xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-soft"
          >
            Create Family Account
          </Link>
        </div>

        <p className="mt-8 text-xs font-semibold text-brand-navy/45">
          Child-safe · Parent managed · Privacy first
        </p>
      </div>

      <Link
        href="/admin"
        aria-label="Admin sign in"
        title="Admin"
        className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/50 text-brand-navy/30 shadow-soft transition hover:bg-white hover:text-brand-navy/70"
      >
        <Shield className="h-4 w-4" />
      </Link>
    </main>
  );
}
