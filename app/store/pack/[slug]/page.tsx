import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { fetchPackBySlug } from '@/lib/packs'
import { createClient as createServerClient } from '@/lib/supabase/server'

export default async function PurchasePackPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? ''
  const pack = await fetchPackBySlug(slug)
  if (!pack) return notFound()

  // If already purchased, link back to pack page
  const supabase = createServerClient()
  const { data: sessionData } = await supabase.auth.getUser()
  const userId = sessionData.user?.id
  let alreadyPurchased = false
  if (userId) {
    const { data: purchase } = await supabase
      .from('pack_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('pack_id', pack.id)
      .maybeSingle()
    alreadyPurchased = Boolean(purchase)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-heading text-text-primary">{pack.title}</h1>
      <p className="mt-2 text-text-secondary">
        {pack.is_free ? 'This pack is already free.' : 'Purchase this premium pack to unlock all items.'}
      </p>

      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href={`/pack/${pack.slug}`}>{alreadyPurchased ? 'Go to Pack' : 'Back to Pack'}</Link>
        </Button>
        {!pack.is_free && !alreadyPurchased ? (
          <Button variant="secondary" disabled>
            Purchase (Coming soon)
          </Button>
        ) : null}
      </div>

      {!userId && !pack.is_free ? (
        <p className="mt-4 text-sm text-text-tertiary">
          Please sign in to purchase. You will return here after signing in.
        </p>
      ) : null}
    </main>
  )
}
