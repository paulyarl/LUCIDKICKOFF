"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { CloneLessonButton } from "@/components/author/CloneLessonButton";
import { AddToPackControl } from "@/components/author/AddToPackControl";

const PAGE_SIZE = 10;

type LessonRow = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  updated_at: string | null;
};

type PackOption = { id: string; title: string };

export function LessonList({
  rows,
  packs,
  memberships,
}: {
  rows: LessonRow[];
  packs: PackOption[];
  memberships: Record<string, string[]>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((l) => l.title.toLowerCase().includes(q));
  }, [rows, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
        No lessons yet. Create the first one above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/35" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search lessons by title…"
          className="w-full rounded-xl border border-brand-navy/15 bg-white py-2 pl-9 pr-3 text-sm text-brand-navy"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
          No lessons match “{query}”.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((lesson) => (
            <li key={lesson.id}>
              <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-bold">{lesson.title}</p>
                  <p className="text-[11px] text-brand-navy/50">
                    {lesson.status} · {lesson.visibility}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  {lesson.status === "published" || lesson.status === "pending_review" ? (
                    <span className="text-xs font-semibold text-brand-navy/35">
                      {lesson.status === "published" ? "Published" : "In review"}
                    </span>
                  ) : (
                    <Link
                      href={`/author/lesson/${lesson.id}`}
                      className="text-xs font-semibold text-brand-teal"
                    >
                      Edit
                    </Link>
                  )}
                  <CloneLessonButton lessonId={lesson.id} />
                  <AddToPackControl
                    lessonId={lesson.id}
                    packs={packs}
                    memberPackIds={memberships[lesson.id] ?? []}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between pt-1 text-xs font-semibold text-brand-navy/60">
          <span>
            Page {currentPage} of {pageCount} · {filtered.length} lesson{filtered.length === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-brand-navy/15 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
              className="rounded-lg border border-brand-navy/15 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
