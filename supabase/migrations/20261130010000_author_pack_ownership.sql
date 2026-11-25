-- Author-owned packs: parents who can author lessons can assemble private draft packs.
-- Existing packs were catalog content before this migration, so backfill them as
-- published/catalog; new packs default to draft/private.

alter table public.packs add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.packs add column if not exists status text not null default 'draft';
alter table public.packs add column if not exists visibility text not null default 'private';
alter table public.packs add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.packs add column if not exists reviewed_at timestamptz;
alter table public.packs add column if not exists published_at timestamptz;
alter table public.packs add column if not exists updated_at timestamptz not null default now();

alter table public.packs add constraint packs_status_check
  check (status in ('draft', 'pending_review', 'published', 'rejected'));
alter table public.packs add constraint packs_visibility_check
  check (visibility in ('private', 'catalog'));

update public.packs
set status = 'published',
    visibility = 'catalog',
    published_at = coalesce(published_at, created_at, now())
where owner_id is null;

create index if not exists idx_packs_owner on public.packs (owner_id);
create index if not exists idx_packs_status on public.packs (status, visibility);

-- Keep discovery limited to catalog packs; author drafts must not leak into browse.
create or replace view public.content_discovery as
  select 'pack' as content_type, p.id::text as content_id,
         coalesce(p.title_i18n->>'en', p.title) as title,
         p.slug, p.cover_path as image_path, p.is_free, p.age_band,
         cc.category_id, cc.position
    from public.packs p
    join public.content_categories cc
      on cc.content_type = 'pack' and cc.content_id = p.id::text
   where p.status = 'published' and p.visibility = 'catalog'
  union all
  select 'lesson', l.id::text, l.title, null, null, true, l.age_band,
         cc.category_id, cc.position
    from public.lessons l
    join public.content_categories cc
      on cc.content_type = 'lesson' and cc.content_id = l.id
   where l.status = 'published' and l.visibility = 'catalog'
  union all
  select 'template', t.id::text, t.title, null, t.image_path, t.is_free, t.age_band,
         cc.category_id, cc.position
    from public.templates t
    join public.content_categories cc
      on cc.content_type = 'template' and cc.content_id = t.id::text
  union all
  select 'tutorial', tu.id::text, tu.title, null, null, true, 'all',
         cc.category_id, cc.position
    from public.tutorials tu
    join public.content_categories cc
      on cc.content_type = 'tutorial' and cc.content_id = tu.id;

-- Category management follows the same ownership rule as lessons.
create or replace function public.can_categorize(p_type text, p_content text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or (
    p_type = 'lesson' and exists (
      select 1 from public.lessons
       where id::text = p_content and owner_id = auth.uid()
    )
  ) or (
    p_type = 'pack' and exists (
      select 1 from public.packs
       where id::text = p_content and owner_id = auth.uid()
    )
  );
$$;

alter table public.packs enable row level security;
alter table public.pack_items enable row level security;

-- Replace the legacy pack read policy in place. Existing catalog rows are backfilled
-- above, while owner/admin rows remain visible to their author contexts.
alter policy "Packs are viewable by everyone" on public.packs
  using (
    (status = 'published' and visibility = 'catalog')
    or owner_id = auth.uid()
    or public.is_admin()
  );
alter policy "Packs are viewable by everyone" on public.packs
  rename to "Readable packs";

create policy "Authors insert draft packs"
  on public.packs for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.get_user_role() in ('parent', 'admin')
    and status in ('draft', 'pending_review')
    and visibility = 'private'
  );

create policy "Authors update own draft packs"
  on public.packs for update to authenticated
  using (owner_id = auth.uid() and status in ('draft', 'pending_review', 'rejected'))
  with check (owner_id = auth.uid() and status in ('draft', 'pending_review', 'rejected'));

create policy "Authors delete own draft packs"
  on public.packs for delete to authenticated
  using (owner_id = auth.uid() and status in ('draft', 'rejected'));

-- Pack items remain entitlement-gated for catalog packs, while owners/admins can
-- read and compose their own drafts. The purchase/family-share clauses preserve the
-- pre-existing entitlement behavior for catalog content. PostgreSQL truncated the
-- original 63-byte policy name, so alter that exact legacy name in place.
alter policy "Pack items readable via free, own purchase, or family-share if " on public.pack_items
  using (
    exists (
      select 1 from public.packs p
      where p.id = pack_items.pack_id
        and (
          p.owner_id = auth.uid()
          or public.is_admin()
          or (
            p.status = 'published'
            and p.visibility = 'catalog'
            and (
              p.is_free = true
              or exists (
                select 1 from public.pack_purchases pu
                where pu.pack_id = p.id and pu.user_id = auth.uid()
              )
              or (
                exists (
                  select 1 from public.child_pack_assignments cpa
                  where cpa.pack_id = p.id and cpa.child_id = auth.uid()
                )
                and exists (
                  select 1
                  from public.family_relationships fr
                  join public.pack_purchases pp on pp.user_id = fr.parent_id and pp.pack_id = p.id
                  where fr.child_id = auth.uid()
                )
              )
            )
          )
        )
    )
  );
alter policy "Pack items readable via free, own purchase, or family-share if " on public.pack_items
  rename to "Readable pack items";

alter policy "Only admins can manage pack items" on public.pack_items
  using (
    public.is_admin() or exists (
      select 1 from public.packs p
      where p.id = pack_items.pack_id
        and p.owner_id = auth.uid()
        and p.status in ('draft', 'pending_review', 'rejected')
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.packs p
      where p.id = pack_items.pack_id
        and p.owner_id = auth.uid()
        and p.status in ('draft', 'pending_review', 'rejected')
    )
  );
alter policy "Only admins can manage pack items" on public.pack_items
  rename to "Owners and admins manage pack items";
