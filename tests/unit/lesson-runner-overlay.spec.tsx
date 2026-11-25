import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LessonRunner } from '../../apps/web/components/learning/LessonRunner';

vi.mock('../../apps/web/lib/analytics/learningEvents', () => ({
  trackStepAttempted: vi.fn(),
  calculateStrokeAggregates: vi.fn(() => ({})),
}));

const ctxStub = {
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
} as unknown as CanvasRenderingContext2D;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype as any, 'getContext').mockImplementation(() => ctxStub);
});

describe('LessonRunner guide overlay', () => {
  const step = {
    id: 'stroke_overlay_test',
    title: 'Trace path',
    type: 'stroke-path' as const,
    guide: {
      path: [{ x: 10, y: 10 }, { x: 100, y: 100 }],
      overlay: '/art/reference.png',
      overlayOpacity: 0.45,
      overlayFit: 'cover',
      overlayVisible: true,
    },
  };

  it('renders the authored overlay in practice with display controls', () => {
    const { container } = render(
      <LessonRunner step={step as any} onStepComplete={() => {}} canSkip={false} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));

    const image = container.querySelector('img') as HTMLImageElement;
    expect(image).toBeTruthy();
    expect(image.getAttribute('src')).toBe('/art/reference.png');
    expect(image.style.objectFit).toBe('cover');
    expect(image.parentElement?.style.opacity).toBe('0.45');
    expect(screen.getByLabelText('Overlay opacity')).toHaveValue('0.45');

    fireEvent.click(screen.getByRole('button', { name: 'Hide overlay image' }));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show overlay image' })).toBeTruthy();
  });
});
