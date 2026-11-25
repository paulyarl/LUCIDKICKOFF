'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Palette, PackageSearch } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { useAuth } from '@/lib/auth/use-auth';
import { createClient } from '@/lib/supabase/client';
import { listAllTemplateWork, type TemplateWork } from '@/lib/learn/persistence';
import BrandShell from '@/components/chrome/BrandShell';
import { Skeleton } from '@/components/ui/skeleton';

type ChildInfo = { id: string; nickname: string | null; avatarUrl: string | null };

type AssignedPack = {
  id: string;
  slug: string | null;
  title: string;
  cover_path: string | null;
  is_free: boolean;
};

type AssignedTemplate = { id: string; title: string; image_path: string };

type AssignedLesson = { id: string; title: string; est_minutes: number | null; status?: string };
type LessonProgress = Record<string, { stepIndex: number; stars: number; passedSteps: number }>;

type Artwork = {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url: string | null;
  like_count: number | null;
  created_at: string;
};

type Tab = 'packs' | 'templates' | 'creations' | 'progress';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ChildLibraryPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useI18n();
  const { user } = useAuth();

  const [child, setChild] = useState<ChildInfo | null>(null);
  const [packs, setPacks] = useState<AssignedPack[]>([]);
  const [lessons, setLessons] = useState<AssignedLesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress>({});
  const [templates, setTemplates] = useState<AssignedTemplate[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [works, setWorks] = useState<TemplateWork[]>([]);
  const [workMeta, setWorkMeta] = useState<Map<string, { title: string; imageUrl: string | null }>>(new Map());
  const [tab, setTab] = useState<Tab>('packs');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetch('/api/child/library');
      const json = res.ok ? await res.json() : null;
      if (!mounted) return;
      if (json?.child) setChild(json.child);
      setPacks((json?.packs ?? []) as AssignedPack[]);
      setLessons((json?.lessons ?? []) as AssignedLesson[]);
      setProgress((json?.progress ?? {}) as LessonProgress);
      setTemplates((json?.templates ?? []) as AssignedTemplate[]);
      setArtworks((json?.artworks ?? []) as Artwork[]);

      const localWorks = listAllTemplateWork(user?.id ? `lc_user_${user.id}` : undefined);
      setWorks(localWorks.filter((w) => w.status === 'in_progress'));

      const tplIds = [...new Set(localWorks.map((w) => w.templateId))];
      if (tplIds.length > 0) {
        const { data: tpls } = await supabase
          .from('templates')
          .select('id, title, image_path')
          .in('id', tplIds);
        if (!mounted) return;
        const meta = new Map<string, { title: string; imageUrl: string | null }>();
        ((tpls ?? []) as any[]).forEach((tp) =>
          meta.set(tp.id, {
            title: tp.title,
            imageUrl: supabase.storage.from('templates').getPublicUrl(tp.image_path).data.publicUrl,
          })
        );
        setWorkMeta(meta);
      }
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'packs', label: t('child.library.tab.packs') || 'My Packs', count: packs.length },
    { id: 'templates', label: t('child.library.tab.templates') || 'Templates', count: templates.length },
    { id: 'creations', label: t('child.library.tab.creations') || 'My Creations', count: artworks.length },
    { id: 'progress', label: t('child.library.tab.progress') || 'In Progress', count: works.length },
  ];

  return (
    <BrandShell>
      <Link href="/child" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline">
        <ArrowLeft className="h-4 w-4" />
        {t('common.back') || 'Back'}
      </Link>
      <header className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          {child?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover shadow-soft" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-teal/15 font-heading text-xl font-bold text-brand-teal">
              {(child?.nickname ?? '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="font-heading text-3xl font-bold">
              {child?.nickname
                ? `${child.nickname}${t('child.library.possessive') || "'s Library"}`
                : t('child.library.title') || 'My Library'}
            </h1>
            <p className="text-sm text-brand-navy/60">
              {t('child.library.subtitle') || 'Packs and activities assigned to you, plus your own work.'}
            </p>
          </div>
        </div>
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <>
          {tab === 'packs' && lessons.length > 0 && (
            <section className="mb-6 space-y-3">
              <h2 className="font-heading text-sm font-bold text-brand-navy">
                {t('child.library.lessons') || 'Your lessons'}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {lessons.map((lesson) => {
                  const p = progress[lesson.id];
                  return (
                    <Link
                      key={lesson.id}
                      href={`/learn/lesson/${lesson.id}`}
                      className="group rounded-card bg-white p-4 shadow-soft transition hover:shadow-md"
                    >
                      <h3 className="font-heading text-sm font-bold leading-tight group-hover:text-brand-teal">
                        {lesson.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-brand-navy/50">
                        {p && p.stepIndex > 0
                          ? `${t('child.library.resume') || 'Resume'} · ${p.passedSteps} passed · ${p.stars}★`
                          : lesson.est_minutes
                            ? `${lesson.est_minutes} min`
                            : t('child.library.notStarted') || 'Not started'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {tab === 'packs' && (
            <Grid empty={t('child.library.empty.packs') || 'No packs assigned yet — ask a parent to assign one!'}>
              {packs.map((p) => (
                <Link
                  key={p.id}
                  href={p.slug ? `/pack/${p.slug}` : `/packs/${p.id}`}
                  className="group overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md"
                >
                  {p.cover_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={supabase.storage.from('packs').getPublicUrl(p.cover_path).data.publicUrl}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-32 place-items-center bg-brand-teal/10 text-brand-teal/50">
                      <BookOpen className="h-7 w-7" />
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <h3 className="font-heading text-sm font-bold leading-tight group-hover:text-brand-teal">
                      {p.title}
                    </h3>
                    <p className="text-[11px] text-brand-navy/50">
                      {p.is_free ? t('packs.free') || 'Free' : t('packs.proBadge') || 'Pro'}
                    </p>
                  </div>
                </Link>
              ))}
            </Grid>
          )}

          {tab === 'templates' && (
            <Grid empty={t('child.library.empty.templates') || 'No templates assigned yet.'}>
              {templates.map((tp) => (
                <Link
                  key={tp.id}
                  href={`/canvas?templateId=${tp.id}`}
                  className="group overflow-hidden rounded-card bg-white shadow-soft transition hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supabase.storage.from('templates').getPublicUrl(tp.image_path).data.publicUrl}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                  <div className="space-y-1 p-3">
                    <h3 className="font-heading text-sm font-bold leading-tight group-hover:text-brand-teal">
                      {tp.title}
                    </h3>
                    <p className="text-[11px] text-brand-navy/50">
                      {t('child.library.colorThis') || 'Tap to color'}
                    </p>
                  </div>
                </Link>
              ))}
            </Grid>
          )}

          {tab === 'creations' && (
            <Grid empty={t('child.library.empty.creations') || 'No creations yet — start coloring!'}>
              {artworks.map((a) => (
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
            </Grid>
          )}

          {tab === 'progress' && (
            <Grid empty={t('child.library.empty.progress') || 'Nothing in progress — open a template to start.'}>
              {works.map((w) => {
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
            </Grid>
          )}
        </>
      )}
    </BrandShell>
  );
}

function Grid({ children, empty }: { children: React.ReactNode; empty: string }) {
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
