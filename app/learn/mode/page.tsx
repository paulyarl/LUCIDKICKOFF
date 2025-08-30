"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ModePickerPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-heading tracking-tight text-text-primary text-center">
        Choose how you want to learn
      </h1>
      <p className="mt-2 text-center text-text-secondary">
        Lessons teach skills step by step. Tutorials guide you to finish pages.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="mode-cards">
        <Link
          href="/learn/lesson/line-control-1/run"
          className="group rounded-lg border border-border bg-surface p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Lessons"
        >
          <article className="pointer-events-none">
            <h2 className="text-xl font-semibold text-text-primary">Lessons</h2>
            <p className="mt-1 text-text-secondary">
              Practice lines and shapes with friendly, short steps.
            </p>
            <div className="mt-4">
              <Button size="lg" className="w-full" aria-hidden>
                Browse Lessons
              </Button>
            </div>
          </article>
        </Link>

        <Link
          href="/tutorial/friendly-lion"
          className="group rounded-lg border border-border bg-surface p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Tutorials"
        >
          <article className="pointer-events-none">
            <h2 className="text-xl font-semibold text-text-primary">Tutorials</h2>
            <p className="mt-1 text-text-secondary">
              Follow onion-skin guides to finish fun drawings.
            </p>
            <div className="mt-4">
              <Button variant="secondary" size="lg" className="w-full" aria-hidden>
                Browse Tutorials
              </Button>
            </div>
          </article>
        </Link>
      </div>
    </main>
  );
}
