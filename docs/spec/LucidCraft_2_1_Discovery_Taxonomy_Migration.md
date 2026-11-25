# LucidCraft 2.1 — Discovery & Taxonomy Migration Plan

Status: proposed
Scope: make categorization a first-class, cross-content discovery layer
("every pack, lesson, activity is part of a category")

## 1. Current state

### Content entities

| Table | Role | Taxonomy today |
|---|---|---|
| `packs` | Sellable/consumable bundles (`pack_items` → lesson/tutorial/template) | `tags text[]` freeform |
| `lessons` | Authored lessons (status/visibility, `owner_id`) | `skill_tag text` freeform, single |
| `templates` | Coloring/drawing activities | `tags text[]` freeform |
| `tutorials` | Guided sequences | none |
| `artworks` | User-generated art | `artwork_categories` join ✓ |
| `carousels` | Curated collections | none (implicitly a curation layer) |

### Categories today

`categories(id, name, slug, description, icon, image_path, is_active)` —
public read (`using (true)`), joined **only** to artworks via
`artwork_categories(artwork_id, category_id)`. Live table is **empty**.

`/category` currently derives chips from `packs.tags` + seeded rows, matched
by name/slug equality — no hard membership.

### Discovery surfaces (affected by this work)

- `/category` — browse packs+lessons by category (rewritten to real data)
- `/packs`, `/pack/[slug]`, `/packs/[id]` — pack listing + detail
- `/learn/[packId]`, `/learn/lesson/[lessonId]`, `/learn/mode`
- `/library`, `/community` — artwork/template feeds
- Admin: `/admin/packs` PackBuilder, `/admin/templates`, `/admin/author`
  LessonAuthoringWizard, `/admin/review`
- Child surfaces: `/child` dashboard, `child_pack_assignments`,
  `child_lesson_assignments`, `child_template_assignments`

## 2. Target model

### `content_categories` — one polymorphic join

Mirrors the `pack_items(kind, ref_id)` precedent already in the schema:

```sql
create table public.content_categories (
  content_type text not null
    check (content_type in ('pack','lesson','template','tutorial','artwork')),
  content_id   uuid not null,
  category_id  uuid not null references public.categories(id) on delete cascade,
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  primary key (content_type, content_id, category_id)
);
create index idx_content_categories_cat
  on public.content_categories (category_id, content_type);
```

`content_id` is intentionally not FK'd (polymorphic; same trade-off as
`pack_items.ref_id`). Existence is enforced at the write path — see
`categorize_content()` below — and `ON DELETE CASCADE` semantics are
approximated by cleanup triggers on `packs`/`lessons`/`templates`/`tutorials`
(artworks keep `artwork_categories`, see §5).

### `categories` enrichment

```sql
alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists kind text not null default 'subject',   -- future facets: age_band, skill
  add column if not exists sort_order int not null default 0;
```

- `kind` lets one table serve multiple discovery facets (subject now,
  age-band or skill facets later) without schema churn.
- `parent_id` enables two-level browse (Animals → Safari Animals) without
  committing to deep trees now.
- `age_band text` column on `packs`, `lessons`, `templates`
  (check: '4-6','7-9','10-12','all', default 'all') — powers the mockups'
  "All Ages" filter, which has no field today.

### Discovery view

```sql
create view public.content_discovery as
  select 'pack'     as content_type, p.id as content_id,
         coalesce(p.title_i18n->>'en', p.title) as title,
         p.slug, p.cover_path, cc.category_id
    from packs p join content_categories cc
      on cc.content_type='pack' and cc.content_id=p.id
  union all
  select 'lesson', l.id, l.title, null, null, cc.category_id
    from lessons l join content_categories cc
      on cc.content_type='lesson' and cc.content_id=l.id
    where l.status='published' and l.visibility='catalog'
  union all
  select 'template', t.id, t.title, null, t.image_path, cc.category_id
    from templates t join content_categories cc
      on cc.content_type='template' and cc.content_id=t.id
  union all
  select 'tutorial', tu.id, tu.title, null, null, cc.category_id
    from tutorials tu join content_categories cc
      on cc.content_type='tutorial' and cc.content_id=tu.id;
```

One select powers "everything in category X" and per-category counts.

### Guarded write path

```sql
create function public.categorize_content(
  p_type text, p_content uuid, p_category uuid
) returns void security definer set search_path = public as $$
begin
  -- admin for everything; lesson authors may categorize their own lessons
  if not public.is_admin() then
    if p_type = 'lesson' and exists (
      select 1 from lessons where id = p_content and owner_id = auth.uid()
    ) then
      null;
    else
      raise exception 'forbidden';
    end if;
  end if;
  -- existence check per type, then insert on conflict do nothing
end $$;
```

Mirrors `set_child_pin`: app calls RPC, DB re-checks permissions
(admin for all types; lesson authors may categorize lessons they own).

### RLS

- `content_categories`: `select using (true)` — catalog discovery is public.
- Writes: admin-only via the RPC; direct table writes get
  `using (is_admin()) with check (is_admin())`.
- `categories` write policy: admin-only (new — currently select-only).

## 3. Backfill

1. Seed `categories` from the agreed starter taxonomy (open question §6).
2. For each `packs.tags[]` / `templates.tags[]` value: map tag → category
   slug via an explicit mapping file (`supabase/seed/tag_category_map.json`
   — freeform tags will NOT cleanly auto-map, e.g. `Tanzania` is a place,
   `Science` is a subject). Unmapped tags land on a `kind='tag'`
   pseudo-category or stay as display-only labels.
3. `lessons.skill_tag` → category via the same map.
4. `artwork_categories` stays as-is initially (see §5).

`tags`/`skill_tag` columns are **kept** during transition — display
fidelity until every surface reads joins.

## 4. Code changes

### Query layer (`lib/db/server.ts`)

New `catalog` namespace on both `UserDatabase` (read) and `ServiceDatabase`
(read+write):

```
db.*.catalog.categories()                     → active categories w/ counts
db.*.catalog.content({category, type?, q?})   → discovery view rows
db.*.catalog.categoriesFor(type, id)          → chips on detail pages
db.service().catalog.categorize(type, id, categoryId)
db.service().catalog.uncategorize(...)
db.service().catalog.upsertCategory({slug,name,kind,parent_id,...})
```

Replaces the tag-derivation logic in `/category/page.tsx`.

### UI

- `/category` — read `content_discovery` + real counts; sections per
  content type (Packs / Lessons / Activities) or unified grid with
  type badges.
- `/pack/[slug]`, `/learn/lesson/[id]`, template cards — category chips
  from `categoriesFor`.
- New `/admin/categories` — CRUD: name, slug, kind, parent, icon,
  image_path, sort_order, is_active.
- `/admin/packs` (PackBuilder), `/admin/templates`, `/admin/author` —
  category multi-select bound to `categorize` RPC on save.
- Category chips become the canonical taxonomy UI — tags render
  underneath as secondary labels.

## 5. Deferred / out of scope

- Folding `artwork_categories` into `content_categories` — mechanical
  (`content_type='artwork'` is already in the check) but the artwork feed
  paths work today; migrate when the community surface is touched.
- Dropping `packs.tags`, `templates.tags`, `lessons.skill_tag` — after all
  surfaces read joins and a parity audit passes.
- Faceted browse UI (`kind` groupings) — schema supports it; UI when a
  second facet is actually seeded.
- Per-child personalized discovery (recommendations) — needs
  `user_activities` signal; separate spec.

## 6. Decisions (locked)

- **Multi-category** per item (join table).
- **Writers: admin + content authors** — `categorize_content` checks
  `is_admin()` or (for lessons) `owner_id = auth.uid()`; pack/template
  authoring is admin-only today so author scope applies to lessons.
- **Scope v1**: packs, lessons, templates (activities), tutorials.
  Artworks join later (their feed already works via `artwork_categories`).

## 7. Starter taxonomy (from product mockups)

Ten `kind='subject'` categories, seeded with descriptions and icons
(`public/art/icon/icon.{key}-48/96.webp` → `categories.icon`):

| slug | name | icon asset |
|---|---|---|
| nature-wildlife | Nature & Wildlife | icon.nature |
| landforms-geography | Landforms & Geography | icon.landforms |
| culture-heritage | Culture & Heritage | icon.culture |
| school-learning | School & Learning | icon.school |
| science-discovery | Science & Discovery | icon.science |
| health-wellbeing | Health & Wellbeing | icon.health |
| arts-creativity | Arts & Creativity | icon.arts |
| sports-games | Sports & Games | icon.sports |
| life-in-tanzania | Life in Tanzania | **missing** |
| our-environment | Our Environment | **missing** |

Tag→category map (live data): `Science`→science-discovery,
`Nature & Wildlife`→nature-wildlife, `Tanzania`→life-in-tanzania.

## 8. Facets (from mockups)

| Filter in UI | Implementation |
|---|---|
| Subject chips / "All Subjects" dropdown | `categories` (kind='subject') — this migration |
| "All Ages" dropdown | **new column** `age_band text` on packs/lessons/templates (check '4-6','7-9','10-12','all') — added in same migration |
| Free / Premium | existing `is_free` (packs, templates) — no schema work |
| Trending / New / Popular | computed sorts (rating_avg/count, published_at) — not categories |

## 9. UI spec (from mockups)

- `/category` → hero banner (savanna `PageBackdrop`-style), chip row
  (All + Trending/New/Popular/Free/Premium sorts), search, **category
  cards grid**: category image, name, description, live pack count from
  `content_discovery`, status badge, arrow CTA.
- `/packs` → chip row (All/My Progress/Downloaded/Free/Premium) +
  Subjects + Ages dropdowns + search; pack cards with progress bar,
  Study / Study+Color buttons; sidebar (Learning Journey, Recently
  Viewed, Recommended — reads `user_lesson_progress`/`user_activities`).
- `/community` → sort chips + category dropdown; artwork cards show their
  category label (confirms artworks join the taxonomy later).


## 10. Rollout

1. Migration: `content_categories` + `categories` enrichment + view +
   RPC + RLS (one file, idempotent style matching repo convention).
2. Seed starter categories + tag→category mapping; run backfill; verify
   counts on live DB.
3. `db.catalog` facade + `/category` rewire + detail-page chips.
4. `/admin/categories` CRUD + pickers in PackBuilder/templates/author.
5. Parity audit → deprecate tags columns (separate migration).

Each phase ships independently; phase 2+ is no-op until categories exist.
