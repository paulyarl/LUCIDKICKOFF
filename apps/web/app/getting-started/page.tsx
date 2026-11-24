import Link from "next/link";
import { ArtImage } from "@/components/frame/ArtImage";

const CARDS = [
  { art: "animal.lion", title: "Color and create", body: "Bring Tanzanian animals to life with brushes, fills and patterns." },
  { art: "pack.amazing-animals.cover", title: "Explore educational packs", body: "Lessons, activities and coloring built around real-world learning." },
  { art: "empty.library", title: "Save your work", body: "Creations are saved locally and synced when you are online." },
  { art: "empty.offline", title: "Learn offline", body: "Download a pack once and keep learning without a connection." },
];

export default function GettingStartedPage() {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="container space-y-8 py-10">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-bold">Getting Started</h1>
          <p className="mt-2 text-sm text-brand-navy/60">
            A quick tour to help you explore, learn, and create with LucidCraft.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <article key={card.title} className="overflow-hidden rounded-panel bg-white p-3 text-center shadow-soft">
              <ArtImage id={card.art as any} className="h-32 w-full rounded-card object-cover" sizes="260px" />
              <h2 className="mt-3 font-heading text-base font-bold">{card.title}</h2>
              <p className="mt-1 text-xs text-brand-navy/60">{card.body}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-brand-navy/15 px-5 py-2 text-sm font-semibold text-brand-navy/70"
          >
            Skip
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-coral px-5 py-2 text-sm font-bold text-white"
          >
            Continue to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
