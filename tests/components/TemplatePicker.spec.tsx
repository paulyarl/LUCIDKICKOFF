import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/i18n/provider', () => ({
  useI18n: () => ({ t: (k: string) => k })
}))

// Dialog portal-less stub if your Dialog uses portals; assuming local rendering is fine here
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children, onOpenChange }: any) => (
    <div aria-hidden={!open} data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div>
  ),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

import { TemplatePicker, type TemplateItem } from '../../apps/web/components/canvas/TemplatePicker'

const templates: TemplateItem[] = [
  { id: 'free1', title: 'Free One', imageUrl: '/img/1.png', isFree: true },
  { id: 'paid1', title: 'Paid One', imageUrl: '/img/2.png' }
]

describe('TemplatePicker', () => {
  it('renders title and template cards when open', () => {
    render(
      <TemplatePicker
        isOpen
        onClose={() => {}}
        templates={templates}
        onSelect={() => {}}
        title="Pick a Template"
      />
    )
    expect(screen.getByText('Pick a Template')).toBeInTheDocument()
    expect(screen.getByText('Free One')).toBeInTheDocument()
    expect(screen.getByText('Paid One')).toBeInTheDocument()
  })

  it('filters to free only when showOnlyFree is true', () => {
    render(
      <TemplatePicker
        isOpen
        onClose={() => {}}
        templates={templates}
        onSelect={() => {}}
        showOnlyFree
      />
    )
    expect(screen.getByText('Free One')).toBeInTheDocument()
    expect(screen.queryByText('Paid One')).toBeNull()
  })

  it('invokes onSelect and onClose when a template is clicked', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <TemplatePicker
        isOpen
        onClose={onClose}
        templates={templates}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByText('Free One'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'free1' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no templates match filter', () => {
    render(
      <TemplatePicker
        isOpen
        onClose={() => {}}
        templates={[]}
        onSelect={() => {}}
      />
    )
    // falls back to key string when i18n not provided; our mock returns keys
    expect(screen.getByText(/canvas\.templates\.empty|No templates available\./i)).toBeInTheDocument()
  })
})
