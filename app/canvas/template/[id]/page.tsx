import { notFound } from 'next/navigation'
import TemplateCanvas from './TemplateCanvas'
import { createClient as createServerClient } from '@/lib/supabase/server'

export default async function TemplateCanvasPage({ params }: { params: { id: string } }) {
  const raw = params?.id
  if (!raw) return notFound()
  const path = decodeURIComponent(raw)

  // Convention: ref_id is a storage path under the 'packs' bucket, e.g. 'templates/friendly-lion.png'
  const supabase = createServerClient()
  const { data, error } = await supabase.storage.from('packs').createSignedUrl(path, 600)
  if (error) return notFound()
  const imageUrl = data?.signedUrl
  if (!imageUrl) return notFound()

  return <TemplateCanvas imageUrl={imageUrl} />
}
