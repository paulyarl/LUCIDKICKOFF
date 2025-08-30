import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock i18n provider to avoid needing real messages
vi.mock('@/lib/i18n/provider', () => ({
  useI18n: () => ({ t: (k: string) => k })
}))

// Mock next/navigation where needed
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams('')
}))

import ParentPage from '../../apps/web/app/parent/page'
import TimeLimitsPage from '../../apps/web/app/parent/time-limits/page'
import ActivityPage from '../../apps/web/app/parent/activity/page'
import AssignPage from '../../apps/web/app/parent/assign/page'
import LinkPage from '../../apps/web/app/parent/link/page'
import PrivacyPage from '../../apps/web/app/parent/privacy/page'
import ChildDetailPage from '../../apps/web/app/parent/child/[id]/page'

// Helper to mount and assert a key appears
const expectText = (re: RegExp) => expect(screen.getByText(re)).toBeInTheDocument()

describe('Parent pages render', () => {
  it('renders parent dashboard', () => {
    render(<ParentPage />)
    expectText(/parent\.dashboard\.title|Parent Dashboard/i)
  })

  it('renders time limits', () => {
    render(<TimeLimitsPage />)
    expectText(/parent\.timeLimits\.title|Set Time Limits/i)
  })

  it('renders activity', () => {
    render(<ActivityPage />)
    expectText(/parent\.activity\.title|View Activity/i)
  })

  it('renders assign', () => {
    render(<AssignPage />)
    expectText(/parent\.assign\.title|Assign content to a child/i)
  })

  it('renders link', () => {
    render(<LinkPage />)
    expectText(/parent\.link\.title|Link a child account/i)
  })

  it('renders privacy', () => {
    render(<PrivacyPage />)
    expectText(/parent\.privacy\.title|Privacy Settings/i)
  })

  it('renders child detail route under parent', () => {
    // The route expects params
    render(<ChildDetailPage params={{ id: '123' }} /> as any)
    expectText(/parent\.child\.title|Child Details/i)
  })
})
