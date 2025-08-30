import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mocks
vi.mock('@/lib/i18n/provider', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en' })
}))
vi.mock('next/link', () => ({ default: ({ href, children }: any) => <a href={href}>{children}</a> }))
vi.mock('@/lib/analytics/learningEvents', () => ({
  trackPackCarouselCompleted: vi.fn()
}))

import PackCarousel, { type CarouselItem } from '../../app/pack/[packId]/PackCarousel'
import { trackPackCarouselCompleted } from '@/lib/analytics/learningEvents'

const items: CarouselItem[] = [
  { id: '1', kind: 'lesson', title: 'L1', href: '/l1' },
  { id: '2', kind: 'tutorial', title: 'T1', href: '/t1' },
  { id: '3', kind: 'template', title: 'Tmp1', href: '/tmp1' }
]

describe('PackCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders slides and controls', () => {
    render(<PackCarousel items={items} packId="pid" packSlug="pack-slug" />)
    // Heading from first slide should be visible
    expect(screen.getByText('L1')).toBeInTheDocument()
    // Controls present
    expect(screen.getByLabelText('a11y.prev')).toBeInTheDocument()
    expect(screen.getByLabelText('a11y.next')).toBeInTheDocument()
  })

  it('navigates next/prev and completes after visiting all slides (tracks once)', () => {
    render(<PackCarousel items={items} packId="pid" packSlug="pack-slug" />)
    const next = screen.getByLabelText('a11y.next')
    const prev = screen.getByLabelText('a11y.prev')

    // advance to end
    fireEvent.click(next)
    expect(screen.getByText('T1')).toBeInTheDocument()
    fireEvent.click(next)
    expect(screen.getByText('Tmp1')).toBeInTheDocument()

    // Visiting all slides should trigger tracking once
    expect(trackPackCarouselCompleted).toHaveBeenCalledTimes(1)

    // go back should not trigger again
    fireEvent.click(prev)
    expect(trackPackCarouselCompleted).toHaveBeenCalledTimes(1)
  })

  it('dot navigation works', () => {
    render(<PackCarousel items={items} packId="pid" packSlug="pack-slug" />)
    const dot2 = screen.getByLabelText(/a11y.goToSlide 2/i)
    fireEvent.click(dot2)
    expect(screen.getByText('T1')).toBeInTheDocument()
  })
})
