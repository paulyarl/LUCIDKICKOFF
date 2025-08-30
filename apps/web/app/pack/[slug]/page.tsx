import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { fetchPackBySlug, fetchPackItems } from '@/lib/packs'
import { TemplateGrid, type TemplateCard } from '@/components/packs/TemplateGrid'
import { createClient } from '@/lib/supabase/server'

function detectServerLocale(): 'en' | 'es' | 'sw' {
  // 1) Cookie set by client i18n provider (if any)
  const c = cookies().get('lc_lang')?.value
  if (c === 'en' || c === 'es' || c === 'sw') return c
  // 2) Accept-Language header
  const al = headers().get('accept-language')?.toLowerCase() || ''
  if (al.startsWith('es')) return 'es'
  if (al.startsWith('sw')) return 'sw'
  return 'en'
}

export default async function PackPage({ params }: { params: { slug: string } }) {
  const pack = await fetchPackBySlug(params.slug)
  if (!pack) notFound()

  // Load pack items and resolve template images from storage
  const items = await fetchPackItems(pack.id)
  const templateItems = items.filter(i => i.kind === 'template')

  const supabase = createClient()
  const templates: TemplateCard[] = []
  if (templateItems.length > 0) {
    // Fetch template rows by IDs present in pack_items.ref_id
    const ids = templateItems.map(i => i.ref_id)
    const { data, error } = await supabase
      .from('templates')
      .select('id, title, image_path, is_free, tags, rating_avg, rating_count')
      .in('id', ids)
    if (error) throw error
    for (const row of data ?? []) {
      const { data: pub } = supabase.storage.from('templates').getPublicUrl(row.image_path)
      templates.push({
        id: row.id,
        title: row.title,
        imageUrl: pub.publicUrl,
        isFree: !!row.is_free,
        tags: row.tags ?? [],
        ratingAvg: row.rating_avg ?? 0,
        ratingCount: row.rating_count ?? 0,
      })
    }
  }

  const locale = detectServerLocale()
  const title = (pack.title_i18n && (pack.title_i18n as any)[locale]) || pack.title

  const stars = (avg?: number) => {
    const a = Math.max(0, Math.min(5, Math.round((avg ?? 0))))
    return '★★★★★'.slice(0, a) + '☆☆☆☆☆'.slice(0, 5 - a)
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <div className="mb-8 text-sm text-muted-foreground flex items-center gap-2">
        <span>{stars((pack as any).rating_avg)}</span>
        <span>{(((pack as any).rating_avg ?? 0) as number).toFixed(1)}</span>
        <span>({(pack as any).rating_count ?? 0})</span>
      </div>

      <TemplateGrid packId={pack.id} templates={templates} />
    </div>
  )
}
