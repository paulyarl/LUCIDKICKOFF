'use server';

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudyCarousel, type StudyPage } from '@/components/packs/StudyCarousel';
import { PackLessons } from '@/components/packs/PackLessons';
import { TemplateGrid, type TemplateCard } from '@/components/packs/TemplateGrid';
import { PackRatingControl } from '@/components/packs/PackRatingControl';
import BrandShell from "@/components/chrome/BrandShell";
import { CategoryChipLinks } from "@/components/chrome/CategoryChipLinks";
import { db } from "@/lib/db/server";

export default async function PackDetailPage({ params }: { params: { id: string } }) {
  const packId = params?.id;
  if (!packId) return notFound();

  const supabase = createClient();

  // Fetch pack
  const { data: pack, error: packErr } = await supabase
    .from('packs')
    .select('*')
    .eq('id', packId)
    .single();
  if (packErr || !pack) return notFound();

  // Build a simple StudyCarousel from pack cover if present (placeholder until study pages are modeled)
  const studyPages: StudyPage[] = [];
  if (pack.cover_path) {
    const { data: pub } = supabase.storage.from('packs').getPublicUrl(pack.cover_path);
    if (pub?.publicUrl) {
      studyPages.push({ id: 'cover', title: pack.title, imageUrl: pub.publicUrl });
    }
  }

  // Fetch templates associated with this pack if schema includes templates.pack_id
  const { data: tmplRows } = await supabase
    .from('templates')
    .select('*')
    .eq('pack_id', packId)
    .order('created_at', { ascending: false });

  const templates: TemplateCard[] = (tmplRows ?? []).map((row: any) => {
    const { data: pub } = supabase.storage.from('templates').getPublicUrl(row.image_path);
    return {
      id: row.id,
      title: row.title,
      imageUrl: pub.publicUrl,
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
        <h1 className="font-heading text-2xl font-bold">{pack.title}</h1>
        <div className="mt-1 text-sm text-brand-navy/60 flex items-center gap-2">
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
