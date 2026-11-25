-- Repair: the owner write policies from 20261124150000_lesson_authoring.sql
-- never reached the live database (parents get RLS violations creating drafts
-- while the catalog/anon read policies work). Idempotent re-assert.

drop policy if exists "Owners insert drafts" on public.lessons;
create policy "Owners insert drafts" on public.lessons for insert to authenticated
with check (owner_id = auth.uid() and status in ('draft', 'pending_review') and visibility = 'private');

drop policy if exists "Owners update drafts" on public.lessons;
create policy "Owners update drafts" on public.lessons for update to authenticated
using (owner_id = auth.uid() and status in ('draft', 'pending_review'))
with check (owner_id = auth.uid() and status in ('draft', 'pending_review'));

drop policy if exists "Owners delete drafts" on public.lessons;
create policy "Owners delete drafts" on public.lessons for delete to authenticated
using (owner_id = auth.uid() and status in ('draft', 'pending_review'));

-- Same gap likely on lesson_steps — owners must add steps to their drafts.
drop policy if exists "Owners write lesson steps" on public.lesson_steps;
create policy "Owners write lesson steps" on public.lesson_steps for all to authenticated
using (public.can_write_lesson(lesson_id))
with check (public.can_write_lesson(lesson_id));
