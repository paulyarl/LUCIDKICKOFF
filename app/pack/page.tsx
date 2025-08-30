import Link from 'next/link'
import { fetchAllPacks } from '@/lib/packs'
import CatalogHeading from './CatalogHeading'
import LocalizedPackTitle from './LocalizedPackTitle'
import PackBadge from './PackBadge'
import LocalizedPackDescription from './LocalizedPackDescription'

export default async function PacksGridPage() {
  const packs = await fetchAllPacks()
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <CatalogHeading />
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((p) => (
          <Link
            href={`/pack/${p.slug}`}
            key={p.id}
            className="block rounded-lg border border-border bg-surface p-5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold text-text-primary">
                <LocalizedPackTitle pack={p} />
              </h2>
              <PackBadge isFree={p.is_free} />
            </div>
            <LocalizedPackDescription pack={p} />
            {p.tags?.length ? (
              <div className="mt-2 text-xs text-text-tertiary">{p.tags.join(' · ')}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  )
}
