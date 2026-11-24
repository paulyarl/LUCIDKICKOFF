import { ArtImage } from "@/components/frame/ArtImage";
import { Bell, BookOpen, Download, RefreshCw, Trophy, Users } from "lucide-react";

const ITEMS = [
  { kind: "achievement", title: "New Achievement!", body: "Amani earned the “Wildlife Explorer” badge.", time: "Today, 4:15 PM", icon: Trophy },
  { kind: "download", title: "Download complete", body: "“Landforms & Geography” is ready to use offline.", time: "Today, 2:30 PM", icon: Download },
  { kind: "approval", title: "Parental approval request", body: "Neema wants to share a coloring in the Community.", time: "Yesterday, 6:40 PM", icon: Users },
  { kind: "sync", title: "Sync update", body: "Your content has been synced across 2 devices.", time: "Yesterday, 3:10 PM", icon: RefreshCw },
  { kind: "learning", title: "Learning progress", body: "Baraka completed a lesson in “Amazing Animals of Tanzania”.", time: "Mon, 5:20 PM", icon: BookOpen },
];

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-navy">
      <div className="container space-y-6 py-8">
        <header>
          <h1 className="font-heading text-3xl font-bold">Notifications Center</h1>
          <p className="text-sm text-brand-navy/60">
            Updates, achievements, and account requests for your family.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {["All (8)", "Learning (3)", "Downloads (2)", "Sync (1)", "Requests (1)"].map((tab, index) => (
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

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            <h2 className="font-heading text-sm font-bold text-brand-navy/60">Today</h2>
            {ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="flex items-start gap-3 rounded-panel bg-white p-4 shadow-soft"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-teal/15 text-brand-teal">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <p className="text-xs text-brand-navy/60">{item.body}</p>
                  </div>
                  <span className="whitespace-nowrap text-[11px] text-brand-navy/45">{item.time}</span>
                </article>
              );
            })}
          </section>

          <aside className="space-y-4">
            <section className="rounded-panel bg-white p-4 text-center shadow-soft">
              <p className="text-xs font-bold text-brand-ochre">New achievement!</p>
              <ArtImage
                id="badge.first-lesson"
                className="mx-auto mt-2 h-28 w-28 object-contain"
                sizes="112px"
              />
              <h2 className="mt-2 font-heading text-lg font-bold">Wildlife Explorer</h2>
              <p className="mt-1 text-xs text-brand-navy/60">
                Amani completed 3 lessons about Tanzanian wildlife and colored 5 animal pages.
              </p>
              <button className="mt-3 w-full rounded-xl bg-brand-teal px-3 py-2 text-xs font-bold text-white">
                View Amani’s progress
              </button>
            </section>

            <section className="flex items-center gap-3 rounded-panel bg-white p-4 shadow-soft">
              <Bell className="h-5 w-5 text-brand-teal" />
              <div>
                <h2 className="text-sm font-bold">Notification preferences</h2>
                <p className="text-[11px] text-brand-navy/50">Choose which updates to receive.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
