'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Heart, PackageSearch, Plus } from 'lucide-react';
import { Icons } from '@/components/icons';
import { CategoryChips } from '@/components/category/CategoryChips';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/provider';
import { useAuth } from '@/lib/auth/use-auth';
import { repo } from '@/lib/api/repository';
import { toggleFavorite } from '@/lib/engagement';
import BrandShell from '@/components/chrome/BrandShell';
import { toast } from 'sonner';

type PackRow = {
  id: string;
  slug: string | null;
  title: string;
  title_i18n: Record<string, string> | null;
  description_i18n: Record<string, string> | null;
  cover_path: string | null;
  is_free: boolean;
  age_band: string | null;
  rating_avg: number | null;
  rating_count: number | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  image_path: string | null;
  sort_order: number;
};

type PackJoin = {
  content_id: string;
  category_id: string;
  categories: { slug: string; name: string } | null;
};

const stars = (avg?: number | null) => {
  const a = Math.max(0, Math.min(5, Math.round(avg ?? 0)));
  return '★★★★★'.slice(0, a) + '☆☆☆☆☆'.slice(0, 5 - a);
};

export default function PacksPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const role = (user?.app_metadata as any)?.role;
  const canAuthor = role === 'admin' || role === 'parent';
  const searchParams = useSearchParams();

  const [packs, setPacks] = useState<PackRow[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [joins, setJoins] = useState<Map<string, { slug: string; name: string; id: string }[]>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const selected = searchParams.get('category') || 'all';
  const newPackHref = selected === 'all'
    ? '/author/packs/new'
    : `/author/packs/new?category=${encodeURIComponent(selected)}`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [packRows, catRows, joinRows] = await Promise.all([
        repo.catalog.packs(),
        repo.catalog.categories('subject'),
        repo.catalog.contentCategoriesFor('pack'),
      ]);
      if (!mounted) return;
      setPacks(packRows as PackRow[]);
      setCats(catRows as CategoryRow[]);
      const byPack = new Map<string, { slug: string; name: string; id: string }[]>();
      ((joinRows ?? []) as PackJoin[]).forEach((j) => {
        if (!j.categories) return;
        const arr = byPack.get(j.content_id) ?? [];
        arr.push({ slug: j.categories.slug, name: j.categories.name, id: j.category_id });
        byPack.set(j.content_id, arr);
      });
      setJoins(byPack);
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load the user's pack favorites
  useEffect(() => {
    if (!user) { setFavorites(new Set()); return; }
    let mounted = true;
    (async () => {
      const favs = await repo.library.favorites('pack');
      if (mounted) setFavorites(new Set(favs.map((r) => r.entity_id)));
    })();
    return () => { mounted = false; };
  }, [user]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    joins.forEach((arr) => arr.forEach((c) => m.set(c.id, (m.get(c.id) ?? 0) + 1)));
    return m;
  }, [joins]);

  const chips = useMemo(
    () => [
      { id: 'all', label: t('category.all') || 'All', count: packs.length },
      ...cats.map((c) => ({ id: c.slug, label: c.name, count: counts.get(c.id) ?? 0 })),
    ],
    [cats, packs.length, counts, t]
  );

  const selectedCat = cats.find((c) => c.slug === selected) ?? null;
  const q = searchQuery.trim().toLowerCase();

  const visible = packs.filter((p) => {
    if (selectedCat) {
      const cats_ = joins.get(p.id) ?? [];
      if (!cats_.some((c) => c.id === selectedCat.id)) return false;
    }
    if (!q) return true;
    const title = p.title_i18n?.[locale] ?? p.title;
    const desc = p.description_i18n?.[locale] ?? '';
    const catNames = (joins.get(p.id) ?? []).map((c) => c.name).join(' ');
    return [title, desc, catNames].some((h) => h.toLowerCase().includes(q));
  });

  const onFavorite = async (packId: string) => {
    if (!user) {
      toast.error(t('packs.toast.signInFavorites') || 'Please sign in to add favorites');
      return;
    }
    const desired = !favorites.has(packId);
    setFavorites((prev) => {
      const next = new Set(prev);
      desired ? next.add(packId) : next.delete(packId);
      return next;
    });
    try {
      await toggleFavorite('pack', packId, desired);
      toast.success(
        desired
          ? t('packs.toast.addedFavorite') || 'Added to favorites'
          : t('packs.toast.removedFavorite') || 'Removed from favorites'
      );
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        desired ? next.delete(packId) : next.add(packId);
        return next;
      });
      toast.error(t('packs.toast.updateFavoritesError') || 'Failed to update favorites');
    }
  };

  return (
    <BrandShell>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 data-testid="packs-title" className="font-heading text-3xl font-bold tracking-tight mb-2">
            {t('packs.title') || 'Learning Packs'}
          </h1>
          <p className="text-brand-navy/60">
            {t('packs.subtitle') || 'Guided journeys through drawing, coloring, and discovery.'}
          </p>
        </div>
        {canAuthor && (
          <Link
            href={newPackHref}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-teal px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-brand-teal/90"
          >
            <Plus className="h-4 w-4" />
            {t('admin.packs.new') || 'New Pack'}
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy/40" />
        <Input
          type="search"
          placeholder={t('packs.search.placeholder') || 'Search packs…'}
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <CategoryChips categories={chips} defaultCategory={selected} showCounts scrollable />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-card bg-white p-12 text-center shadow-soft">
          <PackageSearch className="mx-auto mb-3 h-10 w-10 text-brand-navy/30" />
          <p className="font-semibold">{t('category.empty') || 'Nothing found'}</p>
          <p className="text-sm text-brand-navy/60">
            {t('packs.emptyHint') || 'Try a different search or category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {visible.map((p) => {
            const title = p.title_i18n?.[locale] ?? p.title;
            const desc = p.description_i18n?.[locale] ?? '';
            const packCats = joins.get(p.id) ?? [];
            const isFav = favorites.has(p.id);
            return (
              <div key={p.id} className="group relative overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md">
                <button
                  type="button"
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={() => onFavorite(p.id)}
                  className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/85 shadow-sm backdrop-blur transition hover:scale-105"
                >
                  <Heart
                    className={`h-4 w-4 transition ${isFav ? 'fill-brand-coral text-brand-coral' : 'text-brand-navy/40'}`}
                  />
                </button>
                <Link href={p.slug ? `/pack/${p.slug}` : `/packs/${p.id}`} className="block">
                  {p.cover_path ? (
                    <PackCover path={p.cover_path} />
                  ) : (
                    <div className="grid aspect-[16/10] place-items-center bg-brand-teal/10 text-brand-teal/50">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-heading font-bold leading-snug group-hover:text-brand-teal">
                      {title}
                    </h3>
                    {desc && (
                      <p className="mt-1 line-clamp-2 text-sm text-brand-navy/60">{desc}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {p.is_free && (
                        <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[11px] font-bold text-brand-teal">
                          {t('packs.free') || 'Free'}
                        </span>
                      )}
                      {p.age_band && p.age_band !== 'all' && (
                        <span className="rounded-full bg-brand-navy/5 px-2 py-0.5 text-[11px] font-semibold text-brand-navy/60">
                          {t('packs.ages', { band: p.age_band }) || `Ages ${p.age_band}`}
                        </span>
                      )}
                    </div>
                    {(p.rating_count ?? 0) > 0 && (
                      <p className="mt-2 text-xs text-brand-gold">
                        {stars(p.rating_avg)}{' '}
                        <span className="text-brand-navy/40">({p.rating_count})</span>
                      </p>
                    )}
                  </div>
                </Link>
                {packCats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                    {packCats.map((c) => (
                      <Link
                        key={c.id}
                        href={`/category?category=${c.slug}`}
                        className="rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-teal transition hover:bg-brand-teal/20"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </BrandShell>
  );
}

function PackCover({ path }: { path: string }) {
  const pub = repo.catalog.packCoverUrl(path);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pub ?? ''} alt="" className="aspect-[16/10] w-full object-cover" />
  );
}
