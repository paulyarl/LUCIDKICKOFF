import { describe, expect, it } from 'vitest';
import { createStep, parseStep } from '../../apps/web/features/learn/steps/registry';
import {
  DEFAULT_OVERLAY_OPACITY,
  getOverlayDisplay,
  overlayPreserveAspectRatio,
} from '../../apps/web/features/learn/overlay';

describe('canvas guide overlays', () => {
  it('preserves overlay display settings on trace-path steps', () => {
    const step = createStep('stroke-path') as any;
    step.guide.overlay = '/art/reference.png';
    step.guide.overlayOpacity = 0.55;
    step.guide.overlayFit = 'cover';
    step.guide.overlayVisible = true;

    const parsed = parseStep(step) as any;

    expect(parsed.guide.overlay).toBe('/art/reference.png');
    expect(parsed.guide.overlayOpacity).toBe(0.55);
    expect(parsed.guide.overlayFit).toBe('cover');
    expect(parsed.guide.overlayVisible).toBe(true);
  });

  it('supports overlay display settings on dot-to-dot steps', () => {
    const step = createStep('dot-to-dot') as any;
    step.guide.overlay = '/art/dots-reference.png';
    step.guide.overlayOpacity = 0.4;
    step.guide.overlayFit = 'fill';
    step.guide.overlayVisible = false;

    const parsed = parseStep(step) as any;

    expect(parsed.guide.overlay).toBe('/art/dots-reference.png');
    expect(parsed.guide.overlayOpacity).toBe(0.4);
    expect(parsed.guide.overlayFit).toBe('fill');
    expect(parsed.guide.overlayVisible).toBe(false);
  });

  it('provides safe learner display defaults', () => {
    expect(getOverlayDisplay({ overlay: '/art/reference.png' })).toEqual({
      src: '/art/reference.png',
      opacity: DEFAULT_OVERLAY_OPACITY,
      fit: 'contain',
      visible: true,
    });
    expect(getOverlayDisplay({ overlay: '/art/reference.png', overlayOpacity: 4 }).opacity).toBe(1);
    expect(getOverlayDisplay({ overlay: '   ' }).src).toBeUndefined();
  });

  it('maps fit modes to SVG preserveAspectRatio values', () => {
    expect(overlayPreserveAspectRatio('contain')).toBe('xMidYMid meet');
    expect(overlayPreserveAspectRatio('cover')).toBe('xMidYMid slice');
    expect(overlayPreserveAspectRatio('fill')).toBe('none');
  });
});
