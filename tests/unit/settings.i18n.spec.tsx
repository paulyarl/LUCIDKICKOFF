import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import SettingsPage from '../../apps/web/app/settings/page'
import { I18nProvider, useI18n } from '../../lib/i18n/provider'

function Switchers() {
  const { setLocale } = useI18n()
  return (
    <div>
      <button aria-label="to-es" onClick={() => setLocale('es')}>to es</button>
      <button aria-label="to-fr" onClick={() => setLocale('fr')}>to fr</button>
    </div>
  )
}

describe('Settings page i18n', () => {
  beforeEach(() => {
    // Reset environment
    document.documentElement.setAttribute('lang', 'en')
    try { localStorage.clear() } catch {}
  })

  it('updates texts and html[lang] when switching to ES', async () => {
    render(
      <I18nProvider>
        <Switchers />
        <SettingsPage />
      </I18nProvider>
    )

    // English defaults
    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    // Switch
    await act(async () => {
      screen.getByLabelText('to-es').click()
    })

    // Spanish assertions
    expect(screen.getByRole('heading', { name: /Configuración/i })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('es')
    expect(localStorage.getItem('lc_lang')).toBe('es')
  })

  it('updates texts and html[lang] when switching to FR', async () => {
    render(
      <I18nProvider>
        <Switchers />
        <SettingsPage />
      </I18nProvider>
    )

    // English defaults
    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    // Switch
    await act(async () => {
      screen.getByLabelText('to-fr').click()
    })

    // French assertions
    expect(screen.getByRole('heading', { name: /Paramètres/i })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('fr')
    expect(localStorage.getItem('lc_lang')).toBe('fr')
  })
})
