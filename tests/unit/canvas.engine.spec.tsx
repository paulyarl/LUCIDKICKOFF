import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import CanvasEngine, { playGhost } from '../../apps/web/features/learn/canvas/CanvasEngine'

// Mock canvas 2D context
const ctxStub = {
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  // props set
  set strokeStyle(v: string) {},
  set lineWidth(v: number) {},
  set lineCap(v: string) {},
  set lineJoin(v: string) {},
} as unknown as CanvasRenderingContext2D

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(HTMLCanvasElement.prototype as any, 'getContext').mockImplementation(() => ctxStub)
})

describe('CanvasEngine', () => {
  it('captures stroke and calls onStrokeComplete with 128 resampled points', async () => {
    const onStrokeComplete = vi.fn()
    const { container } = render(
      <CanvasEngine width={200} height={100} onStrokeComplete={onStrokeComplete} />
    )
    const canvas = container.querySelector('canvas') as HTMLCanvasElement

    // Simulate pointer events to draw a simple line
    const rect = { left: 0, top: 0, width: 200, height: 100 }
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(rect as any)

    const mkEvt = (x: number, y: number): any => ({ clientX: x, clientY: y, pressure: 0.5, pointerId: 1, preventDefault() {} })

    canvas.dispatchEvent(new PointerEvent('pointerdown', mkEvt(10, 10)))
    canvas.dispatchEvent(new PointerEvent('pointermove', mkEvt(50, 20)))
    canvas.dispatchEvent(new PointerEvent('pointermove', mkEvt(100, 30)))
    canvas.dispatchEvent(new PointerEvent('pointerup', mkEvt(100, 30)))

    // It should have called with resampled 128 points
    expect(onStrokeComplete).toHaveBeenCalledTimes(1)
    const arg = onStrokeComplete.mock.calls[0][0]
    expect(Array.isArray(arg)).toBe(true)
    expect(arg.length).toBe(128)
  })
})

describe('playGhost', () => {
  it('resolves even if context missing or empty path', async () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null as any)
    await expect(playGhost(canvas, [])).resolves.toBeUndefined()
  })

  it('animates using requestAnimationFrame and resolves', async () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(ctxStub)

    // Make RAF immediate
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: (time: number) => void) => {
        cb(performance.now() + 1000); // simulate time progression
        return 1;
      });

    await expect(playGhost(canvas, [{ x: 0, y: 0 }, { x: 10, y: 10 }], { speed: 10 })).resolves.toBeUndefined()
    expect(raf).toHaveBeenCalled()
  })
})
