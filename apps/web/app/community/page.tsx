import Link from "next/link";
import { ArtImage } from "@/components/frame/ArtImage";
import { COMMUNITY_ARTISTS, COMMUNITY_ITEMS } from "@/lib/fixtures/discovery";

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="container space-y-6 py-8">
        <header className="space-y-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">Community</h1>
            <p className="text-sm text-brand-navy/60">
              Discover, learn from, and be inspired by creations from the LucidCraft community.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["For You", "Popular", "New", "Trending", "Challenges"].map((tab, index) => (
              <span
                key={tab}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  index === 0 ? "bg-brand-teal text-white" : "bg-white text-brand-navy/60 shadow-soft"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {COMMUNITY_ITEMS.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-panel bg-white shadow-soft">
                <ArtImage
                  id={item.art as any}
                  className="h-40 w-full object-cover"
                  sizes="(max-width: 1024px) 50vw, 320px"
                />
                <div className="space-y-2 p-3">
                  <h2 className="font-heading text-sm font-bold leading-tight">{item.title}</h2>
                  <p className="text-[11px] text-brand-navy/50">
                    {item.by} · {item.kind}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/packs"
                      className="rounded-lg bg-brand-teal px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      Study this
                    </Link>
                    <Link
                      href="/canvas"
                      className="rounded-lg bg-brand-coral px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      Color this
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <section className="rounded-panel bg-white p-4 shadow-soft">
              <h2 className="font-heading text-sm font-bold">Featured artists</h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {COMMUNITY_ARTISTS.map((artist) => (
                  <div key={artist.name} className="text-center">
                    <ArtImage
                      id={artist.art as any}
                      className="mx-auto h-12 w-12 rounded-full object-cover"
                      sizes="48px"
                    />
                    <p className="mt-1 truncate text-[10px] font-semibold">{artist.name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-panel bg-white p-4 shadow-soft">
              <h2 className="font-heading text-sm font-bold">Ongoing challenge</h2>
              <p className="mt-1 text-xs text-brand-navy/60">Tanzania Wildlife Challenge</p>
              <p className="text-[11px] text-brand-navy/45">Ends in 5 days</p>
              <button className="mt-3 w-full rounded-lg bg-brand-coral px-3 py-2 text-xs font-bold text-white">
                Join challenge
              </button>
            </section>

            <section className="rounded-panel bg-white p-4 shadow-soft">
              <h2 className="font-heading text-sm font-bold">Related to your interests</h2>
              <ul className="mt-2 space-y-2 text-xs font-semibold text-brand-navy/70">
                <li>Amazing Animals of Tanzania</li>
                <li>Our Culture &amp; Traditions</li>
                <li>Landforms of Tanzania</li>
              </ul>
            </section>

            <p className="rounded-panel bg-brand-teal/10 p-3 text-[11px] font-semibold text-brand-navy/70">
              Pseudonymous and guardian-approved. No public profiles, comments or follower counts.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
