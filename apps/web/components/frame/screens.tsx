import Link from "next/link";
import { ArrowLeft, Check, Lock, Play } from "lucide-react";
import { ArtImage } from "./ArtImage";
import { BottomNav, Frame, Progress, TopBar } from "./shell";
import { homeFixture, packFixture, profilesFixture } from "@/lib/fixtures/frame";
import { PacksFrame, CategoriesFrame, CommunityFrame, LibraryFrame } from "./discovery";

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

export function HomeFrame() {
  return (
    <Frame title="Dashboard" note="Continue learning, categories, bottom navigation.">
      <TopBar avatarId={homeFixture.child.avatarId} name={homeFixture.child.name} />
      <div className="space-y-6 px-6 py-5">
        <div>
          <h3 className="font-heading text-2xl font-bold">Welcome back, {homeFixture.child.name}</h3>
          <p className="text-sm text-brand-navy/60">Keep learning, coloring, and creating!</p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-heading text-lg font-bold">Continue learning</h4>
            <Link href="/frame/packs" className="text-xs font-semibold text-brand-teal">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {homeFixture.packs.map((pack) => (
              <article key={pack.id} className="overflow-hidden rounded-card bg-white shadow-soft">
                <ArtImage
                  id={pack.artId}
                  className="h-28 w-full object-cover"
                  sizes="(max-width: 1100px) 33vw, 320px"
                />
                <div className="space-y-2 p-3">
                  <h5 className="line-clamp-2 font-heading text-sm font-bold">{pack.title}</h5>
                  <Progress value={pack.progress} />
                  <div className="flex items-center justify-between text-[11px] text-brand-navy/50">
                    <span>{pack.lessons} lessons</span>
                    <span>{pack.progress}%</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-heading text-lg font-bold">Browse by category</h4>
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
            {homeFixture.categories.map((category) => (
              <Link
                key={category.id}
                href="/frame/categories"
                className={`flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-card px-2 py-3 text-center ${
                  CATEGORY_TINT[category.id] ?? "bg-brand-cream"
                }`}
              >
                <ArtImage
                  id={category.artId}
                  className="h-11 w-11 object-contain mix-blend-multiply"
                  sizes="44px"
                />
                <span className="text-[11px] font-semibold leading-tight text-brand-navy/80">
                  {category.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active="home" />
    </Frame>
  );
}

export function PackFrame() {
  return (
    <Frame title="Pack detail" note="Cover with title scrim, progress, lesson list with states.">
      <div className="relative h-56 w-full">
        <ArtImage id={packFixture.artId} className="h-full w-full object-cover" sizes="1024px" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/85 via-brand-navy/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 p-5 text-brand-cream">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand-cream/80">
            <ArrowLeft className="h-4 w-4" /> Back to packs
          </div>
          <h3 className="font-heading text-3xl font-bold leading-tight">{packFixture.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {packFixture.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-brand-cream/20 px-2.5 py-1 text-[11px] font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white">
                Study this pack
              </button>
              <Link href="/canvas" className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white">
                Color this pack
              </Link>
            </div>
            <span className="hidden text-xs font-semibold text-brand-navy/50 lg:inline">5 lessons · 6–12</span>
          </div>

          <ol className="space-y-2">
            {packFixture.lessons.map((lesson, index) => (
              <li
                key={lesson.id}
                className={`flex items-center gap-3 rounded-card bg-white p-3 ${
                  lesson.state === "locked" ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full text-white ${
                    lesson.state === "done"
                      ? "bg-brand-teal"
                      : lesson.state === "current"
                        ? "bg-brand-coral"
                        : "bg-brand-navy/30"
                  }`}
                >
                  {lesson.state === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : lesson.state === "current" ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold">
                      {index + 1}. {lesson.title}
                    </span>
                    <span className="text-[11px] text-brand-navy/50">{lesson.minutes} min</span>
                  </div>
                  {lesson.state === "current" && lesson.progress ? (
                    <Progress value={lesson.progress} className="mt-2" />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card bg-white p-4 shadow-soft">
            <h4 className="font-heading text-base font-bold">Your progress</h4>
            <div className="mt-2 flex items-end justify-between">
              <span className="font-heading text-3xl font-bold text-brand-teal">{packFixture.progress}%</span>
              <span className="text-xs text-brand-navy/50">3 of 5 lessons</span>
            </div>
            <Progress value={packFixture.progress} className="mt-3" />
          </div>
          <div className="rounded-card bg-white p-4 shadow-soft">
            <h4 className="font-heading text-base font-bold">What you'll learn</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-brand-navy/70">
              {packFixture.objectives.map((objective) => (
                <li key={objective} className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-teal" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <BottomNav active="packs" />
    </Frame>
  );
}

export function PickerFrame() {
  return (
    <Frame title="Choose a learner" note="Six profiles, circular avatars, parent-managed.">
      <div className="space-y-5 px-6 py-6">
        <div>
          <h3 className="font-heading text-2xl font-bold">Choose a learner</h3>
          <p className="text-sm text-brand-navy/60">Pick a profile to continue, or add a child.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {profilesFixture.map((profile) => (
            <div key={profile.id} className="flex min-h-[76px] items-center gap-3 rounded-card bg-white p-3 shadow-soft">
              <ArtImage id={profile.artId} className="h-14 w-14 rounded-full object-cover" sizes="56px" />
              <div>
                <div className="text-sm font-bold">{profile.name}</div>
                <div className="text-[11px] text-brand-navy/50">{profile.age} years</div>
              </div>
            </div>
          ))}
          <button className="flex min-h-[76px] items-center justify-center rounded-card border-2 border-dashed border-brand-navy/20 text-sm font-semibold text-brand-navy/50">
            + Add child
          </button>
        </div>
      </div>
    </Frame>
  );
}

export function StatesFrame() {
  return (
    <Frame title="Empty & offline" note="Art-led states, no UI chrome baked into the image.">
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <div className="rounded-card bg-white p-4 text-center shadow-soft">
          <ArtImage id="empty.library" className="mx-auto h-32 w-32 object-contain" sizes="128px" />
          <h4 className="mt-2 font-heading text-base font-bold">No creations yet</h4>
          <p className="text-xs text-brand-navy/60">Color a page and it will appear here.</p>
        </div>
        <div className="rounded-card bg-white p-4 text-center shadow-soft">
          <ArtImage id="empty.offline" className="mx-auto h-32 w-32 object-contain" sizes="128px" />
          <h4 className="mt-2 font-heading text-base font-bold">You're offline</h4>
          <p className="text-xs text-brand-navy/60">Downloaded packs still play.</p>
        </div>
      </div>
    </Frame>
  );
}

export const FRAME_SCREENS = {
  home: HomeFrame,
  packs: PacksFrame,
  pack: PackFrame,
  categories: CategoriesFrame,
  community: CommunityFrame,
  library: LibraryFrame,
  picker: PickerFrame,
  states: StatesFrame,
} as const;

export type FrameScreen = keyof typeof FRAME_SCREENS;
