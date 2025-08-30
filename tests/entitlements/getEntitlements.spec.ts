import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getEntitlements, type ClientEntitlements } from '../../apps/web/lib/entitlements/client'

// Helper
const keyFor = (userId: string) => `lc_entitlements_${userId}`

describe('getEntitlements()', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
  })

  it('returns EMPTY when not in browser (no window/localStorage)', () => {
    const win = (globalThis as any).window
    ;(globalThis as any).window = undefined
    const res = getEntitlements('u1')
    expect(res).toEqual({ templateIds: [], packIds: [], planCodes: [] })
    ;(globalThis as any).window = win
  })

  it('returns EMPTY when no data for user', () => {
    const res = getEntitlements('u-missing')
    expect(res).toEqual({ templateIds: [], packIds: [], planCodes: [] })
  })

  it('parses stored entitlements for a user id', () => {
    const ent: ClientEntitlements = {
      templateIds: ['t1','t2'],
      packIds: ['p1'],
      planCodes: ['pro']
    }
    localStorage.setItem(keyFor('u123'), JSON.stringify(ent))
    const res = getEntitlements('u123')
    expect(res).toEqual(ent)
  })

  it('guards against malformed JSON by returning EMPTY', () => {
    localStorage.setItem(keyFor('bad'), '{not json')
    const res = getEntitlements('bad')
    expect(res).toEqual({ templateIds: [], packIds: [], planCodes: [] })
  })

  it('coerces non-array fields to arrays safely', () => {
    localStorage.setItem(keyFor('u2'), JSON.stringify({ templateIds: 'x', packIds: 42, planCodes: null }))
    const res = getEntitlements('u2')
    expect(res).toEqual({ templateIds: [], packIds: [], planCodes: [] })
  })
})
