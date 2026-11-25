'use server';

import { notFound } from 'next/navigation';
import { db } from '@/lib/api/server';
import { StudyCarousel, type StudyPage } from '@/components/packs/StudyCarousel';
import { PackLessons } from '@/components/packs/PackLessons';
import { PackHero } from '@/components/packs/PackHero';
import { PackOfflineButton } from '@/components/packs/PackOfflineButton';
import { TemplateGrid, type TemplateCard } from '@/components/packs/TemplateGrid';
import { PackRatingControl } from '@/components/packs/PackRatingControl';
import BrandShell from "@/components/chrome/BrandShell";
import { CategoryChipLinks } from "@/components/chrome/CategoryChipLinks";

export default async function PackDetailPage({ params }: { params: { id: string } }) {
  const packId = params?.id;
  if (!packId) return notFound();

  // Fetch pack
  const pack = await db.catalog().packById(packId);
  if (!pack) return notFound();

  // Build a simple StudyCarousel from pack cover if present (placeholder until study pages are modeled)
  const coverUrl = db.catalog().packCoverUrl(pack.cover_path);
  const studyPages: StudyPage[] = [];
  if (coverUrl) {
    studyPages.push({ id: 'cover', title: pack.title, imageUrl: coverUrl });
  }

  // Fetch templates associated with this pack if schema includes templates.pack_id
  const tmplRows = await db.catalog().templates({ packId });

  const templates: TemplateCard[] = (tmplRows ?? []).map((row: any) => {
    return {
      id: row.id,
      title: row.title,
      imageUrl: db.catalog().templateImageUrl(row.image_path) ?? '',
      isFree: !!row.is_free,
      ratingAvg: row.rating_avg ?? 0,
      ratingCount: row.rating_count ?? 0,
    } as TemplateCard;
  });

  const stars = (avg?: number) => {
    const a = Math.max(0, Math.min(5, Math.round((avg ?? 0))));
    return '★★★★★'.slice(0, a) + '☆☆☆☆☆'.slice(0, 5 - a);
  };

  return (
    <BrandShell className="space-y-10">
      <div>
        <PackHero imageUrl={coverUrl} title={pack.title} />
        <div className="mt-2 text-sm text-brand-navy/60 flex items-center gap-2">
          <span>{stars(pack.rating_avg)}</span>
          <span>{Number(pack.rating_avg ?? 0).toFixed(1)}</span>
          <span>({pack.rating_count ?? 0})</span>
        </div>
        <div className="mt-2">
          {/* Client-side rating control for this pack */}
          <PackRatingControl packId={packId} />
        </div>
        <CategoryChipLinks
          categories={await db.catalog().categoriesFor("pack", packId)}
          className="mt-2"
        />
        {pack.slug && (
          <div className="mt-3">
            <PackOfflineButton slug={pack.slug} />
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Study</h2>
        <StudyCarousel pages={studyPages} carouselId={packId} />
      </section>

      <PackLessons packId={packId} isFree={!!pack.is_free} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Coloring</h2>
        <TemplateGrid packId={packId} templates={templates} />
      </section>
    </BrandShell>
  );
}
