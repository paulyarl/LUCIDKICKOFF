import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/i18n/provider', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
// Mock icons to avoid import path mismatch between app and root components
vi.mock('@/components/icons', () => ({
  Icons: new Proxy(
    {},
    {
      get: () => (props: any) => <span data-testid="icon" {...props} />,
    }
  ),
}));
// Mock next/image
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
// Mock PackCard to avoid importing next/image/next/link from the app package (prevents duplicate React)
vi.mock('../../apps/web/components/packs/PackCard', () => ({
  PackCard: (props: any) => (
    <div data-testid="pack-card">
      <h3>{props.title}</h3>
      <p>{props.description}</p>
    </div>
  ),
}));

import { PackGrid, type Pack } from '../../apps/web/components/packs/PackGrid';

const packs: Pack[] = [
  { id: 'a', title: 'Alpha', description: 'A pack', imageUrl: '/a.png', ratingAvg: 4.6, ratingCount: 12 },
  { id: 'b', title: 'Beta', description: 'B pack', imageUrl: '/b.png', ratingAvg: 3.9, ratingCount: 30 },
  { id: 'c', title: 'Gamma', description: 'C pack', imageUrl: '/c.png', ratingAvg: 4.9, ratingCount: 4 },
];

describe('PackGrid rating filters and sorting', () => {
  it('filters by min rating and min rating count', () => {
    render(<PackGrid packs={packs} />);

    // Set min rating to 4+
    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[0];
    const minRatingSelect = selects.find((s) => (s as HTMLSelectElement).value !== (sortSelect as HTMLSelectElement).value) as HTMLSelectElement | undefined;

    // There are 3 selects (sort, minRating, minRatingCount). We'll locate by options present.
    const [sort, minRating, minCount] = selects;

    fireEvent.change(minRating, { target: { value: '4' } });
    // Set min rating count to 5+
    fireEvent.change(minCount, { target: { value: '5' } });

    // Expect only Alpha (4.6,12) remains; Gamma (4.9,4) excluded by count; Beta (3.9,30) excluded by rating
    const cards = screen.getAllByTestId('pack-card');
    const cardTitles = cards.map((c) => c.querySelector('h3')?.textContent);
    expect(cardTitles).toContain('Alpha');
    expect(cardTitles).not.toContain('Beta');
    expect(cardTitles).not.toContain('Gamma');
  });

  it('sorts by rating descending', () => {
    render(<PackGrid packs={packs} />);
    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[0];
    // Change sort to rating
    fireEvent.change(sortSelect, { target: { value: 'rating' } });

    // The first rendered card title should be Gamma (4.9)
    const cards = screen.getAllByTestId('pack-card');
    const firstTitle = cards[0].querySelector('h3')?.textContent;
    expect(firstTitle).toContain('Gamma');
  });
});
