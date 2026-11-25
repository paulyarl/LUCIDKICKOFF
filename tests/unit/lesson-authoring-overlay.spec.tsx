import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StepInspector } from '../../apps/web/features/learn/authoring/inspector';

vi.mock('../../apps/web/features/learn/authoring/MediaPicker', () => ({
  MediaPicker: ({ value }: { value: string; onChange: (value: string) => void }) => (
    <input data-testid="media-picker" readOnly value={value} />
  ),
}));

describe('lesson authoring overlay preview', () => {
  it('renders dot-to-dot overlays in the capture surface with authored display settings', () => {
    const step = {
      id: 'dots_overlay_test',
      type: 'dot-to-dot' as const,
      title: 'Dot to dot',
      guide: {
        targets: [{ x: 100, y: 100 }, { x: 300, y: 200 }],
        overlay: '/art/reference.png',
        overlayOpacity: 0.5,
        overlayFit: 'cover',
        overlayVisible: true,
      },
    };

    const { container } = render(<StepInspector step={step as any} onChange={() => {}} />);
    const image = container.querySelector('svg image');

    expect(image?.getAttribute('href')).toBe('/art/reference.png');
    expect(image?.getAttribute('opacity')).toBe('0.5');
    expect(image?.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');
    expect(screen.getByText('Overlay display')).toBeTruthy();
    expect(screen.getByLabelText(/opacity/i)).toHaveValue('0.5');
  });

  it('renders trace-path overlays in the capture surface and patches visibility controls', () => {
    const onChange = vi.fn();
    const step = {
      id: 'stroke_overlay_authoring_test',
      type: 'stroke-path' as const,
      title: 'Trace path',
      guide: {
        path: [{ x: 10, y: 10 }, { x: 100, y: 100 }],
        overlay: '/art/reference.png',
        overlayOpacity: 0.4,
        overlayFit: 'contain',
        overlayVisible: true,
      },
    };

    const { container } = render(<StepInspector step={step as any} onChange={onChange} />);

    expect(container.querySelector('svg image')?.getAttribute('href')).toBe('/art/reference.png');
    fireEvent.click(screen.getByRole('button', { name: /visible/i }));
    expect(onChange).toHaveBeenCalledWith({
      guide: expect.objectContaining({ overlayVisible: false }),
    });
  });
});
