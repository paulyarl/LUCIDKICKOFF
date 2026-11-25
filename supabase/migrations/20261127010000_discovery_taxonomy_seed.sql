-- 2.1 discovery taxonomy: seed the ten subject categories (from product
-- mockups) + backfill content_categories from existing tags / skill_tag.

insert into public.categories (slug, name, description, icon, image_path, is_active, kind, sort_order)
values
  ('nature-wildlife','Nature & Wildlife','Explore Tanzania''s amazing animals and natural habitats.','icon.nature','art/animal/animal.giraffe-640.webp',true,'subject',10),
  ('landforms-geography','Landforms & Geography','Discover mountains, lakes, plains, and more.','icon.landforms','art/scene/hero.savanna-640.webp',true,'subject',20),
  ('culture-heritage','Culture & Heritage','Learn about Tanzania''s people, history, and traditions.','icon.culture','art/scene/pack.culture-traditions.cover-640.webp',true,'subject',30),
  ('school-learning','School & Learning','Build key skills in reading, math, and science.','icon.school',null,true,'subject',40),
  ('science-discovery','Science & Discovery','Explore, experiment, and solve real-world questions.','icon.science',null,true,'subject',50),
  ('health-wellbeing','Health & Wellbeing','Learn healthy habits for a strong and happy you.','icon.health',null,true,'subject',60),
  ('arts-creativity','Arts & Creativity','Express yourself through art, patterns, and design.','icon.arts',null,true,'subject',70),
  ('sports-games','Sports & Games','Get active, play, and learn teamwork and fairness.','icon.sports',null,true,'subject',80),
  ('life-in-tanzania','Life in Tanzania','Explore everyday life, places, and communities in Tanzania.',null,null,true,'subject',90),
  ('our-environment','Our Environment','Learn how to care for our land, water, and wildlife.',null,'art/animal/habitat.forest-480.webp',true,'subject',100)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  image_path  = excluded.image_path,
  is_active   = excluded.is_active,
  kind        = excluded.kind,
  sort_order  = excluded.sort_order;

-- Tag/skill_tag -> category mapping (extend as taxonomy grows).
with map(slug, tag) as (
  values
    ('science-discovery','Science'),
    ('science-discovery','STEM'),
    ('nature-wildlife','Nature & Wildlife'),
    ('nature-wildlife','Animals'),
    ('nature-wildlife','Wildlife'),
    ('life-in-tanzania','Tanzania'),
    ('life-in-tanzania','Life in Tanzania'),
    ('landforms-geography','Landforms & Geography'),
    ('landforms-geography','Geography'),
    ('landforms-geography','Landforms'),
    ('culture-heritage','Culture & Heritage'),
    ('culture-heritage','Culture'),
    ('culture-heritage','Heritage'),
    ('school-learning','School & Learning'),
    ('school-learning','School'),
    ('health-wellbeing','Health & Wellbeing'),
    ('health-wellbeing','Health'),
    ('arts-creativity','Arts & Creativity'),
    ('arts-creativity','Art'),
    ('sports-games','Sports & Games'),
    ('sports-games','Sports'),
    ('our-environment','Our Environment'),
    ('our-environment','Environment')
)
insert into public.content_categories (content_type, content_id, category_id, position)
select 'pack', p.id::text, c.id, 0
  from public.packs p
  cross join lateral unnest(p.tags) as tg
  join map m on lower(m.tag) = lower(tg)
  join public.categories c on c.slug = m.slug
on conflict do nothing;

with map(slug, tag) as (
  values
    ('science-discovery','Science'),('science-discovery','STEM'),
    ('nature-wildlife','Nature & Wildlife'),('nature-wildlife','Animals'),('nature-wildlife','Wildlife'),
    ('life-in-tanzania','Tanzania'),('life-in-tanzania','Life in Tanzania'),
    ('landforms-geography','Landforms & Geography'),('landforms-geography','Geography'),('landforms-geography','Landforms'),
    ('culture-heritage','Culture & Heritage'),('culture-heritage','Culture'),('culture-heritage','Heritage'),
    ('school-learning','School & Learning'),('school-learning','School'),
    ('health-wellbeing','Health & Wellbeing'),('health-wellbeing','Health'),
    ('arts-creativity','Arts & Creativity'),('arts-creativity','Art'),
    ('sports-games','Sports & Games'),('sports-games','Sports'),
    ('our-environment','Our Environment'),('our-environment','Environment')
)
insert into public.content_categories (content_type, content_id, category_id, position)
select 'template', t.id::text, c.id, 0
  from public.templates t
  cross join lateral unnest(t.tags) as tg
  join map m on lower(m.tag) = lower(tg)
  join public.categories c on c.slug = m.slug
on conflict do nothing;

with map(slug, tag) as (
  values
    ('science-discovery','Science'),('science-discovery','STEM'),
    ('nature-wildlife','Nature & Wildlife'),('nature-wildlife','Animals'),('nature-wildlife','Wildlife'),
    ('life-in-tanzania','Tanzania'),('life-in-tanzania','Life in Tanzania'),
    ('landforms-geography','Landforms & Geography'),('landforms-geography','Geography'),('landforms-geography','Landforms'),
    ('culture-heritage','Culture & Heritage'),('culture-heritage','Culture'),('culture-heritage','Heritage'),
    ('school-learning','School & Learning'),('school-learning','School'),
    ('health-wellbeing','Health & Wellbeing'),('health-wellbeing','Health'),
    ('arts-creativity','Arts & Creativity'),('arts-creativity','Art'),
    ('sports-games','Sports & Games'),('sports-games','Sports'),
    ('our-environment','Our Environment'),('our-environment','Environment')
)
insert into public.content_categories (content_type, content_id, category_id, position)
select 'lesson', l.id::text, c.id, 0
  from public.lessons l
  join map m on lower(m.tag) = lower(l.skill_tag)
  join public.categories c on c.slug = m.slug
on conflict do nothing;
