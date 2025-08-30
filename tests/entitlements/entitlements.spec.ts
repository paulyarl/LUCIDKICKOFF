import { describe, it, expect, beforeEach, vi } from 'vitest';
import { filterTemplatesForUser, type ClientEntitlements } from '../../apps/web/lib/entitlements/client';

const tpl = (id: string, free = false, tags: string[] = []) => ({
  id,
  title: id,
  imageUrl: `/img/${id}.png`,
  isFree: free,
  tags,
});

describe('filterTemplatesForUser', () => {
  beforeEach(() => {
    // Reset localStorage between tests (jsdom environment)
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('guest only sees free templates', () => {
    const templates = [tpl('t1', true), tpl('t2', false)];
    const res = filterTemplatesForUser(templates, {
      isGuest: true,
      entitlements: { templateIds: [], packIds: [], planCodes: [] },
    });
    expect(res.map(t => t.id)).toEqual(['t1']);
  });

  it('user with explicit template entitlement sees those, even if not free', () => {
    const templates = [tpl('t1', false), tpl('t2', false)];
    const ent: ClientEntitlements = { templateIds: ['t2'], packIds: [], planCodes: [] };
    const res = filterTemplatesForUser(templates, { isGuest: false, entitlements: ent });
    expect(res.map(t => t.id)).toEqual(['t2']);
  });

  it('user with pack entitlement sees templates tagged with that pack', () => {
    const templates = [tpl('t1', false, ['pack:packA']), tpl('t2', false, ['pack:packB'])];
    const ent: ClientEntitlements = { templateIds: [], packIds: ['packA'], planCodes: [] };
    const res = filterTemplatesForUser(templates, { isGuest: false, entitlements: ent });
    expect(res.map(t => t.id)).toEqual(['t1']);
  });

  it('user with pack entitlement sees templates via localStorage mapping when tags are absent', () => {
    const templates = [tpl('t1', false), tpl('t2', false)];
    const ent: ClientEntitlements = { templateIds: [], packIds: ['packX'], planCodes: [] };
    localStorage.setItem('lc_pack_templates_packX', JSON.stringify(['t2']));
    const res = filterTemplatesForUser(templates, { isGuest: false, entitlements: ent });
    expect(res.map(t => t.id)).toEqual(['t2']);
  });

  it('user with no entitlements falls back to free templates', () => {
    const templates = [tpl('t1', true), tpl('t2', false)];
    const ent: ClientEntitlements = { templateIds: [], packIds: [], planCodes: [] };
    const res = filterTemplatesForUser(templates, { isGuest: false, entitlements: ent });
    expect(res.map(t => t.id)).toEqual(['t1']);
  });

  it('packId restriction: if user not entitled to packId, result is empty', () => {
    const templates = [tpl('t1', false, ['pack:packA']), tpl('t2', false, ['pack:packB'])];
    const ent: ClientEntitlements = { templateIds: [], packIds: ['packA'], planCodes: [] };
    const res = filterTemplatesForUser(templates, { isGuest: false, entitlements: ent, packId: 'packB' });
    expect(res).toEqual([]);
  });

  it('packId restriction: if user entitled to packId, return only that pack templates when tagged', () => {
    const templates = [tpl('t1', false, ['pack:packA']), tpl('t2', false, ['pack:packB'])];
    const ent: ClientEntitlements = { templateIds: [], packIds: ['packA','packB'], planCodes: [] };
    const res = filterTemplatesForUser(templates, { isGuest: false, entitlements: ent, packId: 'packB' });
    expect(res.map(t => t.id)).toEqual(['t2']);
  });
});
