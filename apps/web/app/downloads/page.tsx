import { ArtImage } from "@/components/frame/ArtImage";
import { Download, RefreshCw, Trash2 } from "lucide-react";

const PACKS = [
  { art: "pack.amazing-animals.cover", title: "Amazing Animals of Tanzania", meta: "Nature & Wildlife · 5 lessons", size: "420 MB", state: "downloaded" },
  { art: "lesson.02.habitats", title: "Landforms & Geography", meta: "Geography & Environment · 4 lessons", size: "350 MB", state: "update" },
  { art: "pack.culture-traditions.cover", title: "Our Culture & Traditions", meta: "Culture & Heritage · 6 lessons", size: "380 MB", state: "downloaded" },
  { art: "lesson.04.protection", title: "Arts & Creativity", meta: "Arts & Expression · 4 lessons", size: "310 MB", state: "not-downloaded" },
  { art: "lesson.05.wildlife-hero", title: "Life on Lake Victoria", meta: "Places & People · 5 lessons", size: "460 MB", state: "not-downloaded" },
];

export default function DownloadsPage() {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="container space-y-6 py-8">
        <header>
          <h1 className="font-heading text-3xl font-bold">Offline Downloads Manager</h1>
          <p className="text-sm text-brand-navy/60">
            Download, update, and manage educational packs for learning anywhere.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <p className="text-xs font-bold text-brand-teal">Downloaded packs</p>
            <p className="mt-1 font-heading text-2xl font-bold">3 packs</p>
            <p className="text-[11px] text-brand-navy/50">1.2 GB</p>
          </div>
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <p className="text-xs font-bold text-brand-ochre">Updates available</p>
            <p className="mt-1 font-heading text-2xl font-bold">1 pack</p>
            <p className="text-[11px] text-brand-navy/50">120 MB</p>
          </div>
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <p className="text-xs font-bold text-brand-navy/60">Device storage</p>
            <p className="mt-1 font-heading text-2xl font-bold">1.2 / 5 GB</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-navy/10">
              <div className="h-full w-1/4 rounded-full bg-brand-teal" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All Packs (5)", "Downloaded (3)", "Updates (1)", "Not downloaded (2)"].map((tab, index) => (
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

        <section className="space-y-2">
          {PACKS.map((pack) => (
            <article key={pack.title} className="flex flex-wrap items-center gap-3 rounded-panel bg-white p-3 shadow-soft">
              <ArtImage id={pack.art as any} className="h-14 w-20 rounded-lg object-cover" sizes="80px" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-heading text-sm font-bold">{pack.title}</h2>
                <p className="text-[11px] text-brand-navy/50">{pack.meta}</p>
              </div>
              <span className="text-[11px] font-semibold text-brand-navy/50">{pack.size}</span>
              {pack.state === "downloaded" ? (
                <span className="rounded-full bg-brand-teal/15 px-2.5 py-1 text-[11px] font-bold text-brand-teal">
                  Downloaded
                </span>
              ) : pack.state === "update" ? (
                <button className="inline-flex items-center gap-1 rounded-lg bg-brand-coral px-3 py-1.5 text-[11px] font-bold text-white">
                  <RefreshCw className="h-3.5 w-3.5" /> Update
                </button>
              ) : (
                <button className="inline-flex items-center gap-1 rounded-lg bg-brand-teal px-3 py-1.5 text-[11px] font-bold text-white">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              )}
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-2 rounded-panel bg-white p-3 shadow-soft">
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-xs font-bold text-white">
            <RefreshCw className="h-4 w-4" /> Sync now
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 px-4 py-2 text-xs font-semibold text-brand-navy/70">
            <Trash2 className="h-4 w-4" /> Free up space
          </button>
        </div>
      </div>
    </main>
  );
}
