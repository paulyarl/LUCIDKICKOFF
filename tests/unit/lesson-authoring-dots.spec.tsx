import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StepInspector } from '../../apps/web/features/learn/authoring/inspector';
import { stripLegacyOriginSentinels } from '../../apps/web/features/learn/points';

vi.mock('../../apps/web/features/learn/authoring/MediaPicker', () => ({
  MediaPicker: ({ value }: { value: string; onChange: (value: string) => void }) => (
    <input data-testid="media-picker" readOnly value={value} />
  ),
}));

function makeStep(targets: Array<{ x: number; y: number }>) {
  return {
    id: 'dots_editing_test',
    type: 'dot-to-dot' as const,
    title: 'Dot to dot',
    guide: { targets },
  };
}

beforeEach(() => {
  vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);

  if (!Element.prototype.setPointerCapture) {
    Object.defineProperty(Element.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => {},
    });
  }
  if (!Element.prototype.releasePointerCapture) {
    Object.defineProperty(Element.prototype, 'releasePointerCapture', {
      configurable: true,
      value: () => {},
    });
  }
});

describe('dot-to-dot authoring editing', () => {
  it('clears all dots instead of resetting them to the canvas origin', () => {
    const onChange = vi.fn();
    render(
      <StepInspector
        step={makeStep([{ x: 100, y: 100 }, { x: 300, y: 200 }]) as any}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onChange).toHaveBeenCalledWith({
      guide: expect.objectContaining({ targets: [] }),
    });
  });

  it('drags an individual dot to a new position without appending another dot', () => {
    const onChange = vi.fn();
    const { container } = render(
      <StepInspector
        step={makeStep([{ x: 100, y: 100 }, { x: 300, y: 200 }]) as any}
        onChange={onChange}
      />,
    );
    const svg = container.querySelector('svg')!;

    fireEvent.pointerDown(screen.getByText('1'), { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent(svg, new MouseEvent('pointermove', { bubbles: true, clientX: 250, clientY: 220 }));
    fireEvent(svg, new MouseEvent('pointerup', { bubbles: true, clientX: 250, clientY: 220 }));

    expect(onChange).toHaveBeenCalledWith({
      guide: expect.objectContaining({
        targets: [{ x: 250, y: 220 }, { x: 300, y: 200 }],
      }),
    });
    expect(onChange).not.toHaveBeenCalledWith({
      guide: expect.objectContaining({
        targets: expect.arrayContaining([{ x: 100, y: 100 }]),
      }),
    });
  });

  it('strips legacy leading origin placeholders, including a single leftover placeholder', () => {
    expect(
      stripLegacyOriginSentinels([
        { x: 0, y: 0 },
        { x: 109, y: 133 },
        { x: 167, y: 41 },
      ]),
    ).toEqual([{ x: 109, y: 133 }, { x: 167, y: 41 }]);

    expect(
      stripLegacyOriginSentinels([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 109, y: 133 },
      ]),
    ).toEqual([{ x: 109, y: 133 }]);
  });
});
