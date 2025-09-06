// Lightweight client-side entitlements helpers
// These are intentionally simple to avoid server dependencies and unblock runtime imports.
// If you have a richer entitlement system, you can enhance these functions later.

export type UserEntitlements = {
  // Example structure; extend as needed for packs, templates, etc.
  allowedPackIds?: string[];
  allowedTemplateIds?: string[];
};

/**
 * Returns the current user's entitlements on the client. For guests this returns an empty object.
 * You can extend this to fetch from an API or hydrate from SSR if needed.
 */
export function getEntitlements(userId: string | null): UserEntitlements {
  try {
    if (!userId) return {};
    // Optional: hydrate from localStorage if previously cached
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(`lc_entitlements_${userId}`) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as UserEntitlements;
    }
  } catch {}
  return {};
}

export type FilterOptions = {
  isGuest: boolean;
  entitlements: UserEntitlements;
  packId?: string;
};

// Minimal shape for templates used in filtering. Deliberately not importing UI types to avoid coupling.
export type FilterableTemplate = {
  id: string;
  isFree?: boolean;
  tags?: string[];
  // You can add packId or other metadata here if needed
  [key: string]: any;
};

/**
 * Filters a list of templates based on guest status, optional packId, and user entitlements.
 * - Guests only see templates with isFree=true
 * - If packId is provided, prefer templates whose tags include that packId (if tags are used that way)
 * - If entitlements specify allowedTemplateIds, restrict to those
 */
export function filterTemplatesForUser(templates: FilterableTemplate[], opts: FilterOptions): FilterableTemplate[] {
  let result = Array.isArray(templates) ? templates.slice() : [];

  // Guests: only free templates
  if (opts.isGuest) {
    result = result.filter(t => !!t.isFree);
  }

  // If packId is specified and templates carry tags, prefer those that match
  if (opts.packId) {
    const matching = result.filter(t => Array.isArray(t.tags) && t.tags.includes(opts.packId!));
    if (matching.length > 0) result = matching;
  }

  // If entitlements limit specific template IDs
  if (opts.entitlements?.allowedTemplateIds && opts.entitlements.allowedTemplateIds.length > 0) {
    const allowed = new Set(opts.entitlements.allowedTemplateIds);
    result = result.filter(t => allowed.has(t.id));
  }

  return result;
}
