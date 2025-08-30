import { describe, it, expect } from 'vitest'
import { Constraints } from '../../apps/web/features/learn/canvas/CanvasEngine';
import { StepSpec } from '../../apps/web/types/lesson';

const mkStep = (constraints?: any): StepSpec => ({ id: 's', title: 't', type: 'stroke-path', constraints })

describe('Constraints helper', () => {
  it('reports tool lock and allowed tool properly', () => {
    const c = new Constraints(mkStep({ tool: 'fill', locked: true }))
    expect(c.isToolLocked()).toBe(true)
    expect(c.getAllowedTool()).toBe('fill')
    expect(c.canUseTool('fill')).toBe(true)
    expect(c.canUseTool('pen')).toBe(false)
  })

  it('validates size range', () => {
    const c = new Constraints(mkStep({ size_range: [3, 6] }))
    expect(c.canUseSize(2)).toBe(false)
    expect(c.canUseSize(3)).toBe(true)
    expect(c.canUseSize(6)).toBe(true)
    expect(c.canUseSize(7)).toBe(false)
  })

  it('validates locked color', () => {
    const c = new Constraints(mkStep({ color: '#f00' }))
    expect(c.canUseColor('#f00')).toBe(true)
    expect(c.canUseColor('#0f0')).toBe(false)
  })

  it('returns permissive defaults when not specified', () => {
    const c = new Constraints(mkStep())
    expect(c.isToolLocked()).toBe(false)
    expect(c.getAllowedTool()).toBe(null)
    expect(c.getSizeRange()).toBe(null)
    expect(c.getLockedColor()).toBe(null)
    expect(c.canUseTool('any')).toBe(true)
    expect(c.canUseSize(999)).toBe(true)
    expect(c.canUseColor('#abc')).toBe(true)
  })
})
