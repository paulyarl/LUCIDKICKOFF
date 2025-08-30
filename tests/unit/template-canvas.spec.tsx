import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/i18n/provider', () => ({ useI18n: () => ({ t: (k: string) => k }) }))

// Mock next/navigation
const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back }),
  useSearchParams: () => ({ get: (k: string) => null })
}))

// Mock next/image to render normal img
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

import TemplateCanvas from '../../app/canvas/template/[id]/TemplateCanvas'

// Mock global Image to control onload and natural sizes
class MockImage {
  public onload: (() => void) | null = null
  public _src = ''
  public naturalWidth = 0
  public naturalHeight = 0
  set src(v: string) {
    this._src = v
    // simulate load
    setTimeout(() => {
      this.naturalWidth = 1024
      this.naturalHeight = 768
      this.onload && this.onload()
    }, 0)
  }
}

describe('TemplateCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    global.Image = MockImage as any
  })

  it('renders background image and DrawingCanvas with loaded size', async () => {
    render(<TemplateCanvas imageUrl="/img/template.png" />)

    // Image renders with default size first, then updates after onload
    const img = await screen.findByRole('img', { name: 'Template' })
    expect(img).toBeInTheDocument()

    // Wait for size update effect
    await waitFor(() => {
      expect(img).toHaveAttribute('width', '1024')
      expect(img).toHaveAttribute('height', '768')
    })
  })

  it('goes back when clicking Back with no from param', async () => {
    render(<TemplateCanvas imageUrl="/img/template.png" />)
    const backBtn = screen.getByRole('button', { name: 'common.back' })
    fireEvent.click(backBtn)
    expect(back).toHaveBeenCalled()
  })

  it('pushes to from param when present', async () => {
    // Remock search params to return from
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ push, back }),
      useSearchParams: () => ({ get: (k: string) => (k === 'from' ? '/return' : null) })
    }))
    // Need to re-import after doMock
    const { default: TemplateCanvasLocal } = await import('../../app/canvas/template/[id]/TemplateCanvas')

    render(<TemplateCanvasLocal imageUrl="/img/template.png" />)
    const backBtn = screen.getByRole('button', { name: 'common.back' })
    fireEvent.click(backBtn)
    expect(push).toHaveBeenCalledWith('/return')
    expect(back).not.toHaveBeenCalled()
  })
})
