import { notFound } from 'next/navigation'
import PackCarousel, { type CarouselItem } from './PackCarousel'
import { fetchPackBySlug, fetchPackItems } from '@/lib/packs'
import PackTitle from './PackTitle'
import LockedPackNotice from './LockedPackNotice'
import LocalizedPackDescription from '../LocalizedPackDescription'

export default async function PackInsidePage({ params }: { params: { packId: string } }) {
  const slug = params?.packId ?? ''
  const pack = await fetchPackBySlug(slug)
  if (!pack) return notFound()

  const itemsDb = await fetchPackItems(pack.id)
  const items: CarouselItem[] = itemsDb.map((it: any) => ({
    id: it.id,
    kind: it.kind,
    title: it.ref_id, // TODO: optionally resolve to pretty title via content metadata
    description: it.metadata?.description_i18n?.en ?? undefined,
    href:
      it.kind === 'lesson'
        ? `/learn/lesson/${it.ref_id}`
        : it.kind === 'template'
        ? `/canvas/template/${encodeURIComponent(it.ref_id)}`
        : `/tutorial/${it.ref_id}`,
    metadata: it.metadata ?? null,
  }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-8" data-testid="pack-carousel">
      <PackTitle pack={pack} />
      <LocalizedPackDescription pack={pack} />
      {items.length > 0 || pack.is_free ? (
        <PackCarousel items={items} packId={pack.id} packSlug={pack.slug} />
      ) : (
        <LockedPackNotice packSlug={pack.slug} />
      )}
    </main>
  )
}
