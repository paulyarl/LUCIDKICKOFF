import Link from "next/link";
import { ArtImage } from "./ArtImage";
import { BottomNav, Frame, Progress, TopBar } from "./shell";
import { homeFixture } from "@/lib/fixtures/frame";

const CATEGORY_TINT: Record<string, string> = {
  nature: "bg-brand-olive/15",
  landforms: "bg-brand-teal/15",
  culture: "bg-brand-ochre/20",
  school: "bg-brand-navy/5",
  science: "bg-brand-teal/10",
  health: "bg-brand-coral/15",
  arts: "bg-brand-coral/10",
  sports: "bg-brand-navy/5",
};

export function PacksFrame() {
  return (
    <Frame title="Educational Packs" note="Discovery layer — every pack, grouped by subject.">
      <TopBar />
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-2xl font-bold">All packs</h3>
          <span className="text-xs font-semibold text-brand-navy/50">
            {homeFixture.packs.length} packs
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {homeFixture.packs.map((pack) => (
            <Link
              key={pack.id}
              href="/frame/pack"
              className="overflow-hidden rounded-card bg-white shadow-soft hover:ring-2 hover:ring-brand-teal/40"
            >
              <ArtImage id={pack.artId} className="h-32 w-full object-cover" sizes="320px" />
              <div className="space-y-2 p-3">
                <h4 className="line-clamp-2 font-heading text-sm font-bold">{pack.title}</h4>
                <p className="line-clamp-2 text-[11px] text-brand-navy/60">{pack.description}</p>
                <Progress value={pack.progress} />
                <div className="flex justify-between text-[11px] text-brand-navy/50">
                  <span>{pack.lessons} lessons</span>
                  <span>{pack.progress}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav active="packs" />
    </Frame>
  );
}

export function CategoriesFrame() {
  return (
    <Frame title="Categories" note="Discovery layer — packs grouped by subject.">
      <TopBar />
      <div className="space-y-5 px-6 py-5">
        <div>
          <h3 className="font-heading text-2xl font-bold">Browse by category</h3>
          <p className="text-sm text-brand-navy/60">Pick a subject, then choose a pack.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {homeFixture.categories.map((category) => (
            <Link
              key={category.id}
              href="/frame/packs"
              className={`flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-card px-3 py-3 text-center ${
                CATEGORY_TINT[category.id] ?? "bg-brand-cream"
              }`}
            >
              <ArtImage
                id={category.artId}
                className="h-12 w-12 object-contain mix-blend-multiply"
                sizes="48px"
              />
              <span className="text-xs font-semibold leading-tight text-brand-navy/80">
                {category.label}
              </span>
            </Link>
          ))}
        </div>
        <div>
          <h4 className="mb-2 font-heading text-lg font-bold">Featured packs</h4>
          <div className="grid grid-cols-3 gap-3">
            {homeFixture.packs.map((pack) => (
              <Link
                key={pack.id}
                href="/frame/pack"
                className="overflow-hidden rounded-card bg-white shadow-soft"
              >
                <ArtImage id={pack.artId} className="h-20 w-full object-cover" sizes="220px" />
                <p className="p-2 text-xs font-bold leading-tight">{pack.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active="categories" />
    </Frame>
  );
}

const COMMUNITY = [
  { art: "animal.lion", label: "Arusha family", kind: "Coloring" },
  { art: "lesson.03.serengeti", label: "Mwanza family", kind: "Lesson" },
  { art: "animal.flamingo", label: "Dar family", kind: "Coloring" },
  { art: "lesson.04.protection", label: "Dodoma family", kind: "Lesson" },
  { art: "animal.elephant", label: "Tanga family", kind: "Coloring" },
  { art: "lesson.02.habitats", label: "Zanzibar family", kind: "Lesson" },
];

export function CommunityFrame() {
  return (
    <Frame title="Community" note="Curated, pseudonymous gallery — no profiles, comments or metrics.">
      <TopBar />
      <div className="space-y-5 px-6 py-5">
        <div>
          <h3 className="font-heading text-2xl font-bold">Made by families across Tanzania</h3>
          <p className="text-sm text-brand-navy/60">Guardian-approved, pseudonymous shares.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COMMUNITY.map((item) => (
            <div key={item.label} className="overflow-hidden rounded-card bg-white shadow-soft">
              <ArtImage id={item.art as any} className="h-32 w-full object-cover" sizes="320px" />
              <div className="p-2">
                <p className="text-xs font-bold">{item.label}</p>
                <p className="text-[10px] text-brand-navy/50">{item.kind}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="rounded-card bg-brand-teal/10 p-3 text-xs font-semibold text-brand-navy/70">
          No public names, comments or follower counts. Sharing is opt-in and guardian-approved.
        </p>
      </div>
      <BottomNav active="community" />
    </Frame>
  );
}

const CREATIONS = [
  { art: "lesson.03.serengeti", title: "Serengeti coloring", kind: "Coloring" },
  { art: "animal.lion", title: "Lion portrait", kind: "Coloring" },
  { art: "lesson.01.meet-wildlife", title: "Wildlife lesson", kind: "Lesson" },
  { art: "animal.flamingo", title: "Flamingo study", kind: "Coloring" },
  { art: "lesson.04.protection", title: "Protection lesson", kind: "Lesson" },
  { art: "animal.elephant", title: "Elephant sketch", kind: "Coloring" },
];

export function LibraryFrame() {
  return (
    <Frame title="My Library" note="User layer — creations, saved packs and finished lessons.">
      <TopBar />
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-2xl font-bold">My Library</h3>
          <span className="text-xs font-semibold text-brand-navy/50">{CREATIONS.length} items</span>
        </div>
        <div className="flex gap-2">
          {["All", "Coloring", "Lessons"].map((tab, index) => (
            <span
              key={tab}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                index === 0 ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-navy/5 text-brand-navy/50"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CREATIONS.map((item) => (
            <div key={item.title} className="overflow-hidden rounded-card bg-white shadow-soft">
              <ArtImage id={item.art as any} className="h-28 w-full object-cover" sizes="280px" />
              <div className="p-2">
                <p className="text-xs font-bold">{item.title}</p>
                <p className="text-[10px] text-brand-navy/50">{item.kind}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="library" />
    </Frame>
  );
}
