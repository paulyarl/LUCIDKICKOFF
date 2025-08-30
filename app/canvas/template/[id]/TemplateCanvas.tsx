"use client";
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { DrawingCanvas } from '@/components/DrawingCanvas'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'

export default function TemplateCanvas({ imageUrl }: { imageUrl: string }) {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const search = useSearchParams()
  const { t } = useI18n()

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      setSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = imageUrl
  }, [imageUrl])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const from = search?.get('from')
            if (from) router.push(from)
            else router.back()
          }}
          className="inline-flex items-center gap-2"
          aria-label={t('common.back') || 'Back'}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{t('common.back') || 'Back'}</span>
        </Button>
      </div>
      <div ref={containerRef} className="relative inline-block border rounded-md overflow-hidden bg-white">
        <Image src={imageUrl} alt="Template" width={size.w} height={size.h} className="block select-none pointer-events-none" />
        <div className="absolute inset-0">
          <DrawingCanvas width={size.w} height={size.h} />
        </div>
      </div>
    </div>
  )
}
