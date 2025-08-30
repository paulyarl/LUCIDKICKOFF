// Optional static fallback mapping of pack -> template IDs for short-term client entitlement.
// Fill this with your known IDs if you don't want to tag templates in the DB yet.
// You can also use localStorage keys: lc_pack_templates_<packId> = JSON.stringify([templateId1, ...])
// Example:
// export const PACK_TEMPLATES: Record<string, string[]> = {
//   'pack-abc': ['tpl-1', 'tpl-2'],
// };

export const PACK_TEMPLATES: Record<string, string[]> = {};
