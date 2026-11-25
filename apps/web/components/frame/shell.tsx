import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Grid3x3, Home, Library, Paintbrush, Users } from "lucide-react";
import type { ArtId } from "@/lib/art";
import { ArtImage } from "./ArtImage";

export function Frame({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-2xl font-bold text-brand-navy">{title}</h2>
        <p className="text-sm text-brand-navy/60">{note}</p>
      </div>
      <div className="w-full max-w-[1024px] overflow-hidden rounded-panel border border-brand-navy/10 bg-brand-cream shadow-soft">
        {children}
      </div>
    </section>
  );
}

export function TopBar({ avatarId, name }: { avatarId: ArtId; name: string }) {
  return (
    <header className="flex items-center justify-between border-b border-brand-navy/10 bg-white/70 px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-teal font-heading text-sm font-bold text-white">
          LC
        </div>
        <span className="font-heading text-lg font-bold text-brand-navy">LucidCraft</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/canvas"
          className="flex min-h-[44px] items-center gap-2 rounded-full bg-brand-coral px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-brand-coral/90"
        >
          <Paintbrush className="h-4 w-4" />
          Start Coloring
        </Link>
        <span className="rounded-full bg-brand-teal/15 px-3 py-1 text-xs font-semibold text-brand-teal">
          Saved on this tablet
        </span>
        <Link
          href="/frame/picker"
          title="Switch learner"
          className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-soft hover:bg-brand-teal/10"
        >
          <ArtImage id={avatarId} className="h-7 w-7 rounded-full object-cover" sizes="28px" />
          <span className="text-sm font-semibold text-brand-navy">{name}</span>
        </Link>
      </div>
    </header>
  );
}

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-brand-navy/10 ${className}`}>
      <div className="h-full rounded-full bg-brand-teal" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-[11px] font-semibold text-brand-navy/70">
      {children}
    </span>
  );
}

export function BottomNav({
  active = "home",
}: {
  active?: "home" | "packs" | "categories" | "community" | "library";
}) {
  const items = [
    { icon: Home, label: "Dashboard", href: "/frame/home", key: "home" },
    { icon: BookOpen, label: "Educational Packs", href: "/frame/packs", key: "packs" },
    { icon: Grid3x3, label: "Categories", href: "/frame/categories", key: "categories" },
    { icon: Users, label: "Community", href: "/frame/community", key: "community" },
    { icon: Library, label: "My Library", href: "/frame/library", key: "library" },
  ];
  return (
    <nav className="flex items-center justify-around border-t border-brand-navy/10 bg-white px-4 py-2">
      {items.map(({ icon: Icon, label, href, key }) => {
        const isActive = key === active;
        return (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold ${
              isActive ? "text-brand-teal" : "text-brand-navy/40 hover:text-brand-navy/70"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
