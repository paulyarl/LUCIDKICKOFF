import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/i18n/provider', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

const toggleFavorite = vi.fn();
const getMyFavorite = vi.fn();
vi.mock('@/lib/engagement', () => ({
  getMyFavorite: (...args: any[]) => getMyFavorite(...args),
  toggleFavorite: (...args: any[]) => toggleFavorite(...args),
}));

// Stub Icons to avoid passing boolean "fill" to DOM elements
vi.mock('@/components/icons', () => ({
  Icons: new Proxy(
    {},
    {
      get: () => (props: any) => <span data-testid="icon" {...props} />,
    }
  ),
}));

// Mock lucide-react icons used directly by StudyCarousel
vi.mock('lucide-react', () => {
  const Stub = (name: string) => (props: any) => <span data-testid={`icon-${name}`} {...props} />;
  return {
    ArrowLeft: Stub('ArrowLeft'),
    ArrowRight: Stub('ArrowRight'),
    Maximize2: Stub('Maximize2'),
    Minimize2: Stub('Minimize2'),
    X: Stub('X'),
    Heart: Stub('Heart'),
  };
});

// Mock next/image and strip boolean-only props like `fill`
vi.mock('next/image', () => ({
  default: ({ fill: _fill, ...rest }: any) => <img {...rest} />,
}));

import { StudyCarousel, type StudyPage } from '@/components/packs/StudyCarousel';

describe('StudyCarousel favorites', () => {
  beforeEach(() => {
    toggleFavorite.mockReset();
    getMyFavorite.mockReset();
    getMyFavorite.mockResolvedValue(false);
  });

  it('loads favorite state and toggles on click', async () => {
    const pages: StudyPage[] = [
      { id: 'p1', title: 'Cover', imageUrl: '/cover.png' },
    ];

    render(<StudyCarousel pages={pages} carouselId="c1" />);

    // Favorite state should be fetched
    await waitFor(() => expect(getMyFavorite).toHaveBeenCalledWith('carousel', 'c1'));

    // Find heart button (aria-label comes from i18n fallbacks)
    const heart = await screen.findByRole('button', { name: /favorite/i });
    fireEvent.click(heart);

    await waitFor(() => expect(toggleFavorite).toHaveBeenCalledWith('carousel', 'c1', true));

    // Toggle back
    fireEvent.click(heart);
    await waitFor(() => expect(toggleFavorite).toHaveBeenCalledWith('carousel', 'c1', false));
  });
});
