import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { I18nProvider, useI18n } from '../../lib/i18n/provider'

function Probe() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <button onClick={() => setLocale('es')} aria-label="to-es">to es</button>
      <span data-testid="hello">{t('nav.home') || 'Home'}</span>
    </div>
  )
}

describe('I18nProvider', () => {
  beforeEach(() => {
    // reset lang and storage
    document.documentElement.setAttribute('lang', 'en')
    try { localStorage.clear() } catch {}
    // reset URL
    const url = new URL('http://localhost/')
    window.history.replaceState({}, '', url)
  })

  it('sets html[lang] and exposes default locale', async () => {
    render(<I18nProvider><Probe /></I18nProvider>)
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(screen.getByTestId('locale').textContent).toBe('en')
  })

  it('switches locale and persists to localStorage', async () => {
    render(<I18nProvider><Probe /></I18nProvider>)
    await act(async () => {
      screen.getByLabelText('to-es').click()
    })
    expect(document.documentElement.getAttribute('lang')).toBe('es')
    expect(screen.getByTestId('locale').textContent).toBe('es')
    expect(localStorage.getItem('lc_lang')).toBe('es')
  })

  it('respects ?lang=es in URL on first mount', () => {
    const url = new URL('http://localhost/?lang=es')
    window.history.replaceState({}, '', url)
    render(<I18nProvider><Probe /></I18nProvider>)
    // effect runs after mount; allow microtask
    expect(document.documentElement.getAttribute('lang')).toBe('es')
    expect(screen.getByTestId('locale').textContent).toBe('es')
  })
})
