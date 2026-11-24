import Link from "next/link";
import { ArtImage } from "@/components/frame/ArtImage";
import { LIBRARY_ITEMS } from "@/lib/fixtures/discovery";

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="container space-y-6 py-8">
        <header className="space-y-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">My Library</h1>
            <p className="text-sm text-brand-navy/60">
              Your creations, saved work and downloaded packs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["My Creations (24)", "In Progress (5)", "Downloaded (3)", "Favorites (12)"].map(
              (tab, index) => (
                <span
                  key={tab}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    index === 0 ? "bg-brand-teal text-white" : "bg-white text-brand-navy/60 shadow-soft"
                  }`}
                >
                  {tab}
                </span>
              ),
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-panel bg-white p-4 shadow-soft">
              <h2 className="font-heading text-sm font-bold">All creations</h2>
              <ul className="mt-2 space-y-1 text-xs font-semibold text-brand-navy/65">
                <li className="rounded-lg bg-brand-teal/10 px-2 py-1.5 text-brand-teal">All Creations</li>
                <li className="px-2 py-1.5">Colored Pages</li>
                <li className="px-2 py-1.5">My Designs</li>
                <li className="px-2 py-1.5">Favorites</li>
                <li className="px-2 py-1.5">Shared (with approval)</li>
                <li className="px-2 py-1.5">Trash</li>
              </ul>
            </section>

            <section className="rounded-panel bg-white p-4 shadow-soft">
              <h2 className="font-heading text-sm font-bold">Storage</h2>
              <p className="mt-1 text-[11px] text-brand-navy/50">1.2 GB of 5 GB used</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-navy/10">
                <div className="h-full w-1/4 rounded-full bg-brand-teal" />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-brand-teal">Offline content · 3 packs</p>
            </section>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-xl font-bold">My Creations</h2>
              <input
                placeholder="Search your library…"
                className="w-full max-w-xs rounded-xl border border-brand-navy/15 bg-white px-3 py-2 text-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {LIBRARY_ITEMS.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-panel bg-white shadow-soft">
                  <ArtImage
                    id={item.art as any}
                    className="h-32 w-full object-cover"
                    sizes="(max-width: 1024px) 50vw, 280px"
                  />
                  <div className="space-y-1 p-3">
                    <h3 className="font-heading text-sm font-bold leading-tight">{item.title}</h3>
                    <p className="text-[11px] text-brand-navy/50">
                      {item.by} · {item.kind}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 rounded-panel bg-white p-3 shadow-soft">
              <Link href="/canvas" className="rounded-xl bg-brand-coral px-4 py-2 text-xs font-bold text-white">
                + Create new coloring
              </Link>
              <Link href="/packs" className="rounded-xl bg-brand-teal px-4 py-2 text-xs font-bold text-white">
                Download more packs
              </Link>
              <button className="rounded-xl border border-brand-navy/15 px-4 py-2 text-xs font-semibold text-brand-navy/70">
                Share (with approval)
              </button>
              <button className="rounded-xl border border-brand-navy/15 px-4 py-2 text-xs font-semibold text-brand-navy/70">
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
