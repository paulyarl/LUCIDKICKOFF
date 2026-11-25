"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

type CategoryOption = { id: string; slug: string; name: string };

export function NewPackForm({
  categories,
  initialCategorySlug,
  initialLessonId,
  initialLessonTitle,
  basePath = "/admin/packs",
}: {
  categories: CategoryOption[];
  initialCategorySlug?: string;
  initialLessonId?: string;
  initialLessonTitle?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(
    () => categories.find((category) => category.slug === initialCategorySlug)?.id ?? "",
  );
  const [ageBand, setAgeBand] = useState("all");
  const [isFree, setIsFree] = useState(true);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input =
    "w-full rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy focus:border-brand-teal focus:outline-none";

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("slug", slug);
      form.set("description", description);
      form.set("category_id", categoryId);
      form.set("age_band", ageBand);
      form.set("is_free", String(isFree));
      if (initialLessonId) form.set("lesson_id", initialLessonId);
      if (cover) form.set("cover", cover);

      const res = await fetch("/api/packs", {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Create failed (${res.status})`);
      router.push(`${basePath}/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-card bg-white p-5 shadow-soft">
      {initialLessonId ? (
        <p className="rounded-xl border border-brand-teal/20 bg-brand-teal/10 px-3 py-2 text-sm font-semibold text-brand-navy/75">
          “{initialLessonTitle ?? "Selected lesson"}” will be added as the first lesson in this pack.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
            Pack title
          </span>
          <input
            className={input}
            value={title}
            onChange={(event) => updateTitle(event.target.value)}
            placeholder="Amazing Animals of Tanzania"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
            Slug
          </span>
          <input
            className={input}
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value);
            }}
            placeholder="amazing-animals-tanzania"
            required
          />
          <span className="mt-1 block text-[11px] text-brand-navy/45">
            Used in links. Lowercase letters, numbers, and hyphens.
          </span>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
          Description
        </span>
        <textarea
          className={input}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="A short description shown with the pack."
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
          Starting category <span className="normal-case text-brand-navy/35">(optional)</span>
        </span>
        <select
          className={input}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">No category yet</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-[11px] text-brand-navy/45">
          You can add more categories in the pack builder.
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
          Cover image <span className="normal-case text-brand-navy/35">(optional)</span>
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setCover(event.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-dashed border-brand-navy/20 bg-brand-cream/50 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-teal file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
        />
        <span className="mt-1 block text-[11px] text-brand-navy/45">
          PNG, JPEG, or WebP up to 2 MB.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-brand-navy/50">
            Age band
          </span>
          <select
            className={input}
            value={ageBand}
            onChange={(event) => setAgeBand(event.target.value)}
          >
            <option value="all">All ages</option>
            <option value="4-6">Ages 4–6</option>
            <option value="7-9">Ages 7–9</option>
            <option value="10-12">Ages 10–12</option>
          </select>
        </label>

        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(event) => setIsFree(event.target.checked)}
            className="h-4 w-4 accent-brand-teal"
          />
          <span className="text-sm font-semibold">Free pack</span>
        </label>
      </div>

      {error ? <p className="text-sm font-semibold text-brand-coral">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || !title.trim() || !slug.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white hover:bg-brand-teal/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Creating…" : "Create Pack"}
        </button>
        <Link
          href={basePath}
          className="rounded-xl bg-brand-navy/5 px-4 py-2 text-sm font-bold text-brand-navy/70 hover:bg-brand-navy/10"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
