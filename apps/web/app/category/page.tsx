'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, PackageSearch, Palette } from 'lucide-react';
import { Icons } from '@/components/icons';
import { CategoryChips } from '@/components/category/CategoryChips';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import BrandShell from '@/components/chrome/BrandShell';

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_path: string | null;
  sort_order: number;
};

type DiscoveryRow = {
  content_type: 'pack' | 'lesson' | 'template' | 'tutorial';
  content_id: string;
  title: string;
  slug: string | null;
  image_path: string | null;
  is_free: boolean;
  age_band: string;
  category_id: string;
};

type PackRow = {
  id: string;
  slug: string;
  title: string;
  title_i18n: Record<string, string> | null;
  description_i18n: Record<string, string> | null;
  tags: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
};

const stars = (avg?: number | null) => {
  const a = Math.max(0, Math.min(5, Math.round(avg ?? 0)));
  return '★★★★★'.slice(0, a) + '☆☆☆☆☆'.slice(0, 5 - a);
};

export default function CategoryPage() {
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const supabase = useMemo(() => createClient(), []);

  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [content, setContent] = useState<DiscoveryRow[]>([]);
  const [packs, setPacks] = useState<Map<string, PackRow>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const selected = searchParams.get('category') || 'all';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [catRes, discRes, packRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, slug, name, description, icon, image_path, sort_order')
          .eq('is_active', true)
          .eq('kind', 'subject')
          .order('sort_order'),
        supabase.from('content_discovery').select('*').order('position'),
        supabase
          .from('packs')
          .select('id, slug, title, title_i18n, description_i18n, tags, rating_avg, rating_count'),
      ]);
      if (!mounted) return;
      setCats((catRes.data ?? []) as CategoryRow[]);
      setContent((discRes.data ?? []) as DiscoveryRow[]);
      setPacks(new Map(((packRes.data ?? []) as PackRow[]).map((p) => [p.id, p])));
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    content.forEach((d) => m.set(d.category_id, (m.get(d.category_id) ?? 0) + 1));
    return m;
  }, [content]);

  const chips = useMemo(
    () => [
      { id: 'all', label: t('category.all') || 'All', count: content.length },
      ...cats.map((c) => ({ id: c.slug, label: c.name, count: counts.get(c.id) ?? 0 })),
    ],
    [cats, content.length, counts, t]
  );

  const selectedCat = cats.find((c) => c.slug === selected) ?? null;

  const matchesSearch = (haystack: (string | null | undefined)[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return haystack.some((h) => !!h && h.toLowerCase().includes(q));
  };

  const visible = content.filter(
    (d) => (!selectedCat || d.category_id === selectedCat.id) && matchesSearch([d.title])
  );
  const packRows = visible.filter((d) => d.content_type === 'pack');
  const activityRows = visible.filter((d) => d.content_type !== 'pack');

  const packTitle = (p: PackRow) => p.title_i18n?.[locale] ?? p.title;
  const packDesc = (p: PackRow) => p.description_i18n?.[locale] ?? '';

  const q = searchQuery.trim().toLowerCase();
  const visibleCats = cats.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      content.some((d) => d.category_id === c.id && d.title.toLowerCase().includes(q))
  );

  return (
    <BrandShell>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">
          {t('category.title') || 'Categories'}
        </h1>
        <p className="text-brand-navy/60">
          {t('category.subtitle') ||
            'Explore themes, find new interests, and color your world with learning.'}
        </p>
      </div>

      <div className="relative mb-6">
        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy/40" />
        <Input
          type="search"
          placeholder={t('category.search') || 'Search categories, packs, and lessons…'}
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <CategoryChips categories={chips} defaultCategory={selected} showCounts scrollable />
      </div>

      {/* Category cards — the discovery layer */}
      {selected === 'all' && (
        <section className="mb-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {visibleCats.map((c) => {
                const n = counts.get(c.id) ?? 0;
                return (
                  <Link
                    key={c.id}
                    href={`/category?category=${c.slug}`}
                    className="group overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md"
                  >
                    <CategoryArt category={c} />
                    <div className="p-4">
                      <h3 className="font-heading font-bold leading-snug group-hover:text-brand-teal">
                        {c.name}
                      </h3>
                      {c.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-brand-navy/60">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs font-bold text-brand-navy/50">
                        <span>
                          {n} {t('category.items') || 'items'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-brand-teal transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Content for the selected category */}
      <section className="mb-12">
        <h2 className="font-heading text-2xl font-bold mb-6">
          {selectedCat ? selectedCat.name : t('category.allContent') || 'Everything'}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-card" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-card bg-white shadow-soft flex flex-col items-center justify-center py-12 text-center">
            <PackageSearch className="h-12 w-12 text-brand-navy/40 mb-4" />
            <h3 className="font-heading text-lg font-bold">
              {t('category.empty.title') || 'Nothing here yet'}
            </h3>
            <p className="text-brand-navy/60 mt-1 max-w-md">
              {searchQuery
                ? `No results for "${searchQuery}".`
                : t('category.empty.category') || 'No content in this category yet.'}
            </p>
          </div>
        ) : (
          <>
            {packRows.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {packRows.map((d) => {
                  const p = packs.get(d.content_id);
                  return (
                    <Link
                      key={d.content_id}
                      href={d.slug ? `/pack/${d.slug}` : `/packs/${d.content_id}`}
                      className="group overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md"
                    >
                      <ContentArt row={d} bucket="packs" icon={<BookOpen className="h-8 w-8" />} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-heading font-bold leading-snug group-hover:text-brand-teal">
                            {p ? packTitle(p) : d.title}
                          </h3>
                          <TypeBadge type="pack" />
                        </div>
                        {p && packDesc(p) && (
                          <p className="mt-1 line-clamp-2 text-sm text-brand-navy/60">
                            {packDesc(p)}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {d.is_free && (
                            <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[11px] font-bold text-brand-teal">
                              {t('packs.free') || 'Free'}
                            </span>
                          )}
                          {(p?.tags ?? []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-brand-navy/5 px-2 py-0.5 text-[11px] font-semibold text-brand-navy/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {(p?.rating_count ?? 0) > 0 && (
                          <p className="mt-2 text-xs text-brand-gold">
                            {stars(p?.rating_avg)}{' '}
                            <span className="text-brand-navy/40">({p?.rating_count})</span>
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {activityRows.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activityRows.map((d) => (
                  <ActivityCard key={`${d.content_type}-${d.content_id}`} row={d} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </BrandShell>
  );
}

function TypeBadge({ type }: { type: DiscoveryRow['content_type'] }) {
  const label = { pack: 'Pack', lesson: 'Lesson', template: 'Activity', tutorial: 'Tutorial' }[type];
  return (
    <span className="shrink-0 rounded-full bg-brand-navy/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy/50">
      {label}
    </span>
  );
}

function CategoryArt({ category }: { category: CategoryRow }) {
  if (category.image_path) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/${category.image_path}`}
        alt=""
        className="aspect-[16/10] w-full object-cover"
      />
    );
  }
  return (
    <div className="grid aspect-[16/10] place-items-center bg-brand-teal/10">
      {category.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/art/icon/${category.icon}-96.webp`} alt="" className="h-16 w-16" />
      ) : (
        <span className="font-heading text-4xl font-bold text-brand-teal/40">
          {category.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function ContentArt({
  row,
  bucket,
  icon,
}: {
  row: DiscoveryRow;
  bucket: 'packs' | 'templates';
  icon: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  if (!row.image_path) {
    return (
      <div className="grid aspect-[16/10] place-items-center bg-brand-teal/10 text-brand-teal/50">
        {icon}
      </div>
    );
  }
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(row.image_path);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pub.publicUrl} alt="" className="aspect-[16/10] w-full object-cover" />
  );
}

function ActivityCard({ row }: { row: DiscoveryRow }) {
  const href =
    row.content_type === 'lesson'
      ? `/learn/lesson/${row.content_id}`
      : row.content_type === 'template'
        ? `/canvas?templateId=${row.content_id}`
        : '#';
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card bg-white p-4 shadow-soft transition hover:shadow-md"
    >
      {row.image_path ? (
        <TemplateThumb path={row.image_path} />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-teal/15 text-brand-teal">
          {row.content_type === 'lesson' ? (
            <BookOpen className="h-5 w-5" />
          ) : (
            <Palette className="h-5 w-5" />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading font-bold">{row.title}</h3>
          <TypeBadge type={row.content_type} />
        </div>
      </div>
    </Link>
  );
}

function TemplateThumb({ path }: { path: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { data: pub } = supabase.storage.from('templates').getPublicUrl(path);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pub.publicUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
  );
}
