import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Basic i18n mock
vi.mock('@/lib/i18n/provider', () => ({
  useI18n: () => ({ t: (k: string) => k })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams('')
}))

import AdminAuthor from '../../apps/web/app/admin/author/page'
import AdminLocalOverrides from '../../apps/web/app/admin/local-overrides/page'

const expectHeadingExists = () => {
  const headings = screen.queryAllByRole('heading')
  expect(headings.length).toBeGreaterThan(0)
}

describe('Admin pages render', () => {
  it('renders admin author page', () => {
    render(<AdminAuthor />)
    expectHeadingExists()
  })

  it('renders admin local-overrides page', () => {
    render(<AdminLocalOverrides />)
    expectHeadingExists()
  })
})
