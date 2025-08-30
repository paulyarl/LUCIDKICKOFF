import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import PacksPage from '../../apps/web/app/packs/page'
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

describe('Packs page i18n', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('lang', 'en')
    try { localStorage.clear() } catch {}
  })

  it('shows translated title and updates lang/localStorage when switching to ES', async () => {
    render(
      <I18nProvider>
        <Switchers />
        <PacksPage />
      </I18nProvider>
    )

    // English baseline
    expect(screen.getByTestId('packs-title')).toHaveTextContent(/Packs/i)
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    // Switch to ES
    await act(async () => {
      screen.getByLabelText('to-es').click()
    })

    // Spanish assertions
    expect(screen.getByTestId('packs-title')).toHaveTextContent(/Paquetes/i)
    expect(document.documentElement.getAttribute('lang')).toBe('es')
    expect(localStorage.getItem('lc_lang')).toBe('es')
  })

  it('shows translated title and updates lang/localStorage when switching to FR', async () => {
    render(
      <I18nProvider>
        <Switchers />
        <PacksPage />
      </I18nProvider>
    )

    // English baseline
    expect(screen.getByTestId('packs-title')).toHaveTextContent(/Packs/i)
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    // Switch to FR
    await act(async () => {
      screen.getByLabelText('to-fr').click()
    })

    // French assertions (title string remains "Packs" in fr.json, but lang & storage must update)
    expect(screen.getByTestId('packs-title')).toHaveTextContent(/Packs/i)
    expect(document.documentElement.getAttribute('lang')).toBe('fr')
    expect(localStorage.getItem('lc_lang')).toBe('fr')
  })
})
