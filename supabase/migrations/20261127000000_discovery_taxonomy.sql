-- 2.1 discovery taxonomy: cross-content categorization.
-- One polymorphic join (pack_items kind/ref_id precedent) + category facets
-- + age_band on catalog content + guarded categorize/uncategorize RPCs.

-- ---------- content_categories ----------
create table if not exists public.content_categories (
  content_type text not null
    check (content_type in ('pack','lesson','template','tutorial','artwork')),
  content_id   text not null,  -- text: lessons.id/tutorials.id are text; uuid ids cast in
  category_id  uuid not null references public.categories(id) on delete cascade,
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  primary key (content_type, content_id, category_id)
);
create index if not exists idx_content_categories_cat
  on public.content_categories (category_id, content_type);
create index if not exists idx_content_categories_content
  on public.content_categories (content_type, content_id);

-- ---------- categories: facets + hierarchy + ordering ----------
alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists kind text not null default 'subject',
  add column if not exists sort_order int not null default 0;

-- ---------- age_band on catalog content ----------
alter table public.packs
  add column if not exists age_band text not null default 'all';
alter table public.lessons
  add column if not exists age_band text not null default 'all';
alter table public.templates
  add column if not exists age_band text not null default 'all';

alter table public.packs drop constraint if exists packs_age_band_check;
alter table public.packs
  add constraint packs_age_band_check check (age_band in ('4-6','7-9','10-12','all'));
alter table public.lessons drop constraint if exists lessons_age_band_check;
alter table public.lessons
  add constraint lessons_age_band_check check (age_band in ('4-6','7-9','10-12','all'));
alter table public.templates drop constraint if exists templates_age_band_check;
alter table public.templates
  add constraint templates_age_band_check check (age_band in ('4-6','7-9','10-12','all'));

-- ---------- discovery view: "everything in category X" in one select ----------
create or replace view public.content_discovery as
  select 'pack' as content_type, p.id::text as content_id,
         coalesce(p.title_i18n->>'en', p.title) as title,
         p.slug, p.cover_path as image_path, p.is_free, p.age_band,
         cc.category_id, cc.position
    from public.packs p
    join public.content_categories cc
      on cc.content_type = 'pack' and cc.content_id = p.id::text
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

-- ---------- orphan cleanup (content_id has no FK; mirror cascade) ----------
create or replace function public.cleanup_content_categories()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.content_categories
   where content_type = TG_ARGV[0] and content_id = OLD.id::text;
  return OLD;
end $$;

drop trigger if exists trg_cc_cleanup_packs on public.packs;
create trigger trg_cc_cleanup_packs after delete on public.packs
  for each row execute function public.cleanup_content_categories('pack');
drop trigger if exists trg_cc_cleanup_lessons on public.lessons;
create trigger trg_cc_cleanup_lessons after delete on public.lessons
  for each row execute function public.cleanup_content_categories('lesson');
drop trigger if exists trg_cc_cleanup_templates on public.templates;
create trigger trg_cc_cleanup_templates after delete on public.templates
  for each row execute function public.cleanup_content_categories('template');
drop trigger if exists trg_cc_cleanup_tutorials on public.tutorials;
create trigger trg_cc_cleanup_tutorials after delete on public.tutorials
  for each row execute function public.cleanup_content_categories('tutorial');
drop trigger if exists trg_cc_cleanup_artworks on public.artworks;
create trigger trg_cc_cleanup_artworks after delete on public.artworks
  for each row execute function public.cleanup_content_categories('artwork');

-- ---------- guarded write path ----------
create or replace function public.can_categorize(p_type text, p_content text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or (
    p_type = 'lesson' and exists (
      select 1 from public.lessons
       where id::text = p_content and owner_id = auth.uid()
    )
  );
$$;

create or replace function public.categorize_content(
  p_type text, p_content text, p_category uuid, p_position int default 0
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('pack','lesson','template','tutorial','artwork') then
    raise exception 'invalid content_type %', p_type;
  end if;
  if not exists (
    select 1 from public.categories where id = p_category and coalesce(is_active, true)
  ) then
    raise exception 'category not found';
  end if;
  if not public.can_categorize(p_type, p_content) then
    raise exception 'forbidden';
  end if;
  -- existence check per type
  if (p_type = 'pack'     and not exists (select 1 from public.packs     where id::text = p_content))
  or (p_type = 'lesson'   and not exists (select 1 from public.lessons   where id::text = p_content))
  or (p_type = 'template' and not exists (select 1 from public.templates where id::text = p_content))
  or (p_type = 'tutorial' and not exists (select 1 from public.tutorials where id::text = p_content))
  or (p_type = 'artwork'  and not exists (select 1 from public.artworks  where id::text = p_content))
  then
    raise exception 'content not found';
  end if;
  insert into public.content_categories (content_type, content_id, category_id, position)
  values (p_type, p_content, p_category, p_position)
  on conflict (content_type, content_id, category_id)
  do update set position = excluded.position;
end $$;

create or replace function public.uncategorize_content(
  p_type text, p_content text, p_category uuid
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_categorize(p_type, p_content) then
    raise exception 'forbidden';
  end if;
  delete from public.content_categories
   where content_type = p_type and content_id = p_content and category_id = p_category;
end $$;

-- ---------- RLS ----------
alter table public.content_categories enable row level security;

drop policy if exists "Content categories are viewable by everyone." on public.content_categories;
create policy "Content categories are viewable by everyone."
  on public.content_categories for select using (true);

drop policy if exists "Admins manage content categories." on public.content_categories;
create policy "Admins manage content categories."
  on public.content_categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage categories." on public.categories;
create policy "Admins manage categories."
  on public.categories for all
  using (public.is_admin()) with check (public.is_admin());
