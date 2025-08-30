// Lightweight client-side entitlements (initial implementation)
// Source of truth: localStorage to allow bootstrapping before server-side entitlements exist.
// You can later swap getEntitlements() to fetch from an API or Supabase RPC without changing callers.

import { PACK_TEMPLATES } from './packMap';

export type ClientEntitlements = {
  templateIds: string[];
  packIds: string[];
  planCodes: string[]; // e.g., ['pro', 'edu'] if you want to gate by plans
};

const EMPTY: ClientEntitlements = { templateIds: [], packIds: [], planCodes: [] };

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getEntitlements(userId?: string | null): ClientEntitlements {
  if (!isBrowser()) return EMPTY;
  try {
    const key = userId ? `lc_entitlements_${userId}` : null;
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    const templateIds: string[] = Array.isArray(parsed?.templateIds) ? parsed.templateIds : [];
    const packIds: string[] = Array.isArray(parsed?.packIds) ? parsed.packIds : [];
    const planCodes: string[] = Array.isArray(parsed?.planCodes) ? parsed.planCodes : [];
    return { templateIds, packIds, planCodes };
  } catch {
    return EMPTY;
  }
}

export type MinimalTemplateItem = {
  id: string;
  title: string;
  imageUrl: string;
  isFree?: boolean;
  tags?: string[];
};

// Optional helper to encode pack membership via tag convention: `pack:<packId>`
function templateHasPackTag(t: MinimalTemplateItem, packId: string): boolean {
  return !!t.tags?.some(tag => tag === `pack:${packId}`);
}

function getPackTemplateIds(packId: string): string[] {
  const staticIds = PACK_TEMPLATES[packId] ?? [];
  if (!isBrowser()) return staticIds;
  try {
    const raw = localStorage.getItem(`lc_pack_templates_${packId}`);
    const lsIds: string[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(lsIds) && lsIds.length > 0) {
      const set = new Set<string>([...staticIds, ...lsIds]);
      return Array.from(set);
    }
  } catch {}
  return staticIds;
}

export function filterTemplatesForUser(
  templates: MinimalTemplateItem[],
  opts: {
    isGuest: boolean;
    entitlements: ClientEntitlements;
    packId?: string;
  }
): MinimalTemplateItem[] {
  const { isGuest, entitlements, packId } = opts;

  let result = templates.slice();

  // Base rule: guests only see free templates
  if (isGuest) {
    result = result.filter(t => !!t.isFree);
  }

  // Users: compute union of explicit template entitlements and templates unlocked via entitled packs
  if (!isGuest) {
    const allowedTemplateIds = new Set(entitlements.templateIds);
    const entitledPackIds = new Set(entitlements.packIds);

    // Templates unlocked by pack entitlement via tags or mapping/localStorage
    const tagUnlocked = result.filter(t =>
      t.tags?.some(tag => tag.startsWith('pack:') && entitledPackIds.has(tag.slice(5)))
    );
    const mapUnlockedIds = new Set<string>();
    Array.from(entitledPackIds).forEach((pid) => {
      getPackTemplateIds(pid).forEach((tid) => mapUnlockedIds.add(tid));
    });

    // Merge: if any explicit template IDs are set, prefer union; if none but packs exist, show pack templates
    if (allowedTemplateIds.size > 0 || entitledPackIds.size > 0) {
      const unionSet = new Set<string>();
      result.forEach((t) => { if (allowedTemplateIds.has(t.id)) unionSet.add(t.id); });
      tagUnlocked.forEach((t) => unionSet.add(t.id));
      Array.from(mapUnlockedIds).forEach((id) => unionSet.add(id));
      result = result.filter(t => unionSet.has(t.id));
    } else {
      // No entitlements at all: default to free templates
      result = result.filter(t => !!t.isFree);
    }
  }

  // Optional pack restriction: if packId provided, and templates encode membership via tag, filter further
  if (packId) {
    // Prefer explicit pack entitlement if provided
    const packEntitled = entitlements.packIds.length === 0 || entitlements.packIds.includes(packId);
    if (!packEntitled) {
      // User not entitled to this pack — return empty (or keep only free if desired)
      // Here we choose to return empty to avoid leaking non-entitled items.
      return [];
    }
    // If templates carry `pack:<id>` tags, use them to filter; otherwise leave as-is
    const anyHasPackTags = result.some(t => templateHasPackTag(t, packId));
    if (anyHasPackTags) {
      result = result.filter(t => templateHasPackTag(t, packId));
    }
  }

  return result;
}
