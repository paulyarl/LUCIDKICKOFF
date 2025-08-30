import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
// Ensure React is available globally for components using classic JSX runtime
(globalThis as any).React = React;

vi.mock('@/lib/i18n/provider', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('@/lib/auth/use-auth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/lib/learn/persistence', () => ({
  listTemplateWorkForPack: () => [],
  loadTemplateWork: () => undefined,
  saveTemplateWork: vi.fn(),
}));

// Mock Next.js app router hooks used inside TemplateGrid
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/packs/pack-1',
  useSearchParams: () => new URLSearchParams(),
}));

const upsertRating = vi.fn();
const getMyRating = vi.fn();
vi.mock('@/lib/engagement', () => ({
  toggleFavorite: vi.fn(),
  upsertRating: (...args: any[]) => upsertRating(...args),
  getMyRating: (...args: any[]) => getMyRating(...args),
}));

// Mock next/image to render plain img
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));

import { TemplateGrid, type TemplateCard } from '@/components/packs/TemplateGrid';

describe('TemplateGrid rating input', () => {
  beforeEach(() => {
    upsertRating.mockReset();
    getMyRating.mockReset();
    getMyRating.mockResolvedValue(null);
  });

  it('shows stars and lets user rate a template, calling upsertRating', async () => {
    const templates: TemplateCard[] = [
      { id: 't1', title: 'Lion', imageUrl: '/lion.png', isFree: true, tags: [], ratingAvg: 4.2, ratingCount: 10 },
    ];

    render(<TemplateGrid packId="p1" templates={templates} />);

    // Find the radiogroup for rating and then click the 5th radio (value 5)
    const group = await screen.findByRole('radiogroup', { name: /Rate Lion/i });
    const stars = within(group).getAllByRole('radio');
    fireEvent.click(stars[4]);

    await waitFor(() => expect(upsertRating).toHaveBeenCalledWith('template', 't1', 5));
  });
});
