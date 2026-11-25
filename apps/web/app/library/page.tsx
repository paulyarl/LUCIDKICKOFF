'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, PackageSearch, Palette } from 'lucide-react';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/provider';
import { useAuth } from '@/lib/auth/use-auth';
import { createClient } from '@/lib/supabase/client';
import { listAllTemplateWork, type TemplateWork } from '@/lib/learn/persistence';
import BrandShell from '@/components/chrome/BrandShell';

type Artwork = {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url: string | null;
  like_count: number | null;
  created_at: string;
};

type FavoriteRow = { entity_type: string; entity_id: string };

type FavoriteCard = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
};

type Tab = 'creations' | 'progress' | 'favorites';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function LibraryPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useI18n();
  const { user, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('creations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [works, setWorks] = useState<TemplateWork[]>([]);
  const [workMeta, setWorkMeta] = useState<Map<string, { title: string; imageUrl: string | null }>>(new Map());
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);

  // Load artworks + favorites (user-scoped) — template work loads from localStorage
  useEffect(() => {
    let mounted = true;
    const userKey = user?.id ? `lc_user_${user.id}` : undefined;
    const worksPromise = listAllTemplateWork(userKey);
    void worksPromise.then((w) => { if (mounted) setWorks(w); });

    (async () => {
      const localWorks = await worksPromise;
      if (!user) {
        if (mounted) { setArtworks([]); setFavorites([]); setIsLoading(false); }
        return;
      }
      const [artRes, favRes] = await Promise.all([
        supabase
          .from('artworks')
          .select('id, title, image_url, thumbnail_url, like_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_favorites')
          .select('entity_type, entity_id')
          .eq('user_id', user.id),
      ]);
      if (!mounted) return;
      setArtworks((artRes.data ?? []) as Artwork[]);

      const favRows = (favRes.data ?? []) as FavoriteRow[];
      const byType = (type: string) => favRows.filter((f) => f.entity_type === type).map((f) => f.entity_id);
      const [packRes, tplRes, carRes] = await Promise.all([
        supabase.from('packs').select('id, slug, title, cover_path').in('id', byType('pack')),
        supabase.from('templates').select('id, title, image_path').in('id', byType('template')),
        supabase.from('carousels').select('id, title').in('id', byType('carousel')),
      ]);
      if (!mounted) return;

      const cards: FavoriteCard[] = [];
      ((packRes.data ?? []) as any[]).forEach((p) =>
        cards.push({
          key: `pack-${p.id}`,
          title: p.title,
          subtitle: t('library.kind.pack') || 'Pack',
          href: p.slug ? `/pack/${p.slug}` : `/packs/${p.id}`,
          imageUrl: p.cover_path
            ? supabase.storage.from('packs').getPublicUrl(p.cover_path).data.publicUrl
            : null,
        })
      );
      ((tplRes.data ?? []) as any[]).forEach((tp) =>
        cards.push({
          key: `template-${tp.id}`,
          title: tp.title,
          subtitle: t('library.kind.template') || 'Template',
          href: `/canvas?templateId=${tp.id}`,
          imageUrl: tp.image_path
            ? supabase.storage.from('templates').getPublicUrl(tp.image_path).data.publicUrl
            : null,
        })
      );
      ((carRes.data ?? []) as any[]).forEach((c) =>
        cards.push({
          key: `carousel-${c.id}`,
          title: c.title,
          subtitle: t('library.kind.collection') || 'Collection',
          href: `/packs/${c.id}`,
          imageUrl: null,
        })
      );
      setFavorites(cards);

      // Resolve template titles/thumbs for in-progress work cards
      const tplIds = [...new Set(localWorks.map((w) => w.templateId))];
      if (tplIds.length > 0) {
        const { data: tpls } = await supabase
          .from('templates')
          .select('id, title, image_path')
          .in('id', tplIds);
        if (!mounted) return;
        const meta = new Map<string, { title: string; imageUrl: string | null }>();
        ((tpls ?? []) as any[]).forEach((tp) => {
          meta.set(tp.id, {
            title: tp.title,
            imageUrl: tp.image_path
              ? supabase.storage.from('templates').getPublicUrl(tp.image_path).data.publicUrl
              : null,
          });
        });
        setWorkMeta(meta);
      }
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, user, t]);

  const q = searchQuery.trim().toLowerCase();
  const match = (...hay: (string | null | undefined)[]) =>
    !q || hay.some((h) => !!h && h.toLowerCase().includes(q));

  const inProgress = works.filter((w) => w.status === 'in_progress');
  const visibleWorks = inProgress.filter((w) => match(workMeta.get(w.templateId)?.title));
  const visibleArt = artworks.filter((a) => match(a.title));
  const visibleFavs = favorites.filter((f) => match(f.title, f.subtitle));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'creations', label: t('library.tab.creations') || 'My Creations', count: artworks.length },
    { id: 'progress', label: t('library.tab.progress') || 'In Progress', count: inProgress.length },
    { id: 'favorites', label: t('library.tab.favorites') || 'Favorites', count: favorites.length },
  ];

  return (
    <BrandShell>
      <header className="mb-6 space-y-3">
        <h1 className="font-heading text-3xl font-bold">{t('library.title') || 'My Library'}</h1>
        <p className="text-sm text-brand-navy/60">
          {t('library.subtitle') || 'Your creations, saved work and favorites.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                tab === tb.id
                  ? 'bg-brand-teal text-white'
                  : 'bg-white text-brand-navy/60 shadow-soft hover:text-brand-navy'
              }`}
            >
              {tb.label} ({tb.count})
            </button>
          ))}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-xl font-bold">{tabs.find((x) => x.id === tab)?.label}</h2>
        <div className="relative w-full max-w-xs">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy/40" />
          <Input
            type="search"
            placeholder={t('library.search') || 'Search your library…'}
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading || authLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <>
          {tab === 'creations' && (
            <LibraryGrid
              empty={
                user
                  ? t('library.empty.creations') || 'No creations yet — start coloring!'
                  : t('library.empty.signIn') || 'Sign in to see your creations.'
              }
            >
              {visibleArt.map((a) => (
                <article key={a.id} className="overflow-hidden rounded-card bg-white shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.thumbnail_url || a.image_url}
                    alt={a.title}
                    className="h-32 w-full object-cover"
                  />
                  <div className="space-y-1 p-3">
                    <h3 className="font-heading text-sm font-bold leading-tight">{a.title}</h3>
                    <p className="text-[11px] text-brand-navy/50">
                      {formatDate(a.created_at)}
                      {(a.like_count ?? 0) > 0 && ` · ${a.like_count} ♥`}
                    </p>
                  </div>
                </article>
              ))}
            </LibraryGrid>
          )}

          {tab === 'progress' && (
            <LibraryGrid
              empty={t('library.empty.progress') || 'No work in progress — open a template to start.'}
            >
              {visibleWorks.map((w) => {
                const meta = workMeta.get(w.templateId);
                return (
                  <Link
                    key={`${w.packId}-${w.templateId}`}
                    href={`/canvas?packId=${w.packId}&templateId=${w.templateId}`}
                    className="group overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md"
                  >
                    {meta?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={meta.imageUrl} alt="" className="h-32 w-full object-cover" />
                    ) : (
                      <div className="grid h-32 place-items-center bg-brand-teal/10 text-brand-teal/50">
                        <Palette className="h-7 w-7" />
                      </div>
                    )}
                    <div className="space-y-1 p-3">
                      <h3 className="font-heading text-sm font-bold leading-tight group-hover:text-brand-teal">
                        {meta?.title || t('library.untitledWork') || 'Untitled work'}
                      </h3>
                      <p className="text-[11px] text-brand-navy/50">
                        {t('library.resume') || 'Tap to resume'} · {formatDate(new Date(w.updatedAt).toISOString())}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </LibraryGrid>
          )}

          {tab === 'favorites' && (
            <LibraryGrid
              empty={
                user
                  ? t('library.empty.favorites') || 'No favorites yet — tap a heart on a pack.'
                  : t('library.empty.signIn') || 'Sign in to see your favorites.'
              }
            >
              {visibleFavs.map((f) => (
                <Link
                  key={f.key}
                  href={f.href}
                  className="group overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md"
                >
                  {f.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.imageUrl} alt="" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="grid h-32 place-items-center bg-brand-teal/10 text-brand-teal/50">
                      <Heart className="h-7 w-7" />
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <h3 className="font-heading text-sm font-bold leading-tight group-hover:text-brand-teal">
                      {f.title}
                    </h3>
                    <p className="text-[11px] text-brand-navy/50">{f.subtitle}</p>
                  </div>
                </Link>
              ))}
            </LibraryGrid>
          )}
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2 rounded-card bg-white p-3 shadow-soft">
        <Link href="/canvas" className="rounded-xl bg-brand-coral px-4 py-2 text-xs font-bold text-white">
          {t('library.newColoring') || '+ Create new coloring'}
        </Link>
        <Link href="/packs" className="rounded-xl bg-brand-teal px-4 py-2 text-xs font-bold text-white">
          {t('library.morePacks') || 'Discover more packs'}
        </Link>
      </div>
    </BrandShell>
  );
}

function LibraryGrid({ children, empty }: { children: React.ReactNode; empty: string }) {
  const items = Array.isArray(children) ? children : [children];
  if (items.filter(Boolean).length === 0) {
    return (
      <div className="rounded-card bg-white p-12 text-center shadow-soft">
        <PackageSearch className="mx-auto mb-3 h-10 w-10 text-brand-navy/30" />
        <p className="text-sm font-semibold text-brand-navy/70">{empty}</p>
      </div>
    );
  }
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
