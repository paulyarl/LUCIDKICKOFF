import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/i18n/provider', () => ({
  useI18n: () => ({ t: (k: string) => k })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams('')
}))

import ChildHome from '../../apps/web/app/child/page'
import ChildLibrary from '../../apps/web/app/child/library/page'
// Link subpage
import ChildLink from '../../apps/web/app/child/link/page'

const expectSomeHeading = () => {
  const headings = screen.queryAllByRole('heading')
  expect(headings.length).toBeGreaterThan(0)
}

describe('Child pages render', () => {
  it('renders child home', () => {
    render(<ChildHome />)
    expectSomeHeading()
  })

  it('renders child library', () => {
    render(<ChildLibrary />)
    expectSomeHeading()
  })

  it('renders child link', () => {
    render(<ChildLink />)
    expectSomeHeading()
  })
})
