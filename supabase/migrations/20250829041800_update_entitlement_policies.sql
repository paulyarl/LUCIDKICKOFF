-- Update entitlement policies for packs (family sharing) and templates (per-child)
-- Generated at 2025-08-29 04:18 local time

-- 1) Update pack_items policy to support family sharing when child is assigned and a parent purchased the pack
-- Drop prior gating policy if exists
DROP POLICY IF EXISTS "Pack items readable if free or purchased" ON public.pack_items;

-- Create combined policy:
-- Allow select if:
--  - pack is free, OR
--  - the requesting user purchased the pack, OR
--  - the requesting user is a child who is assigned the pack AND any of their linked parents purchased the pack
CREATE POLICY "Pack items readable via free, own purchase, or family-share if assigned"
  ON public.pack_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.packs p
      WHERE p.id = pack_items.pack_id
        AND (
          p.is_free = TRUE
          OR EXISTS (
            SELECT 1 FROM public.pack_purchases pu
            WHERE pu.pack_id = p.id AND pu.user_id = auth.uid()
          )
          OR (
            -- family sharing path: child must have assignment AND a parent purchased
            EXISTS (
              SELECT 1 FROM public.child_pack_assignments cpa
              WHERE cpa.pack_id = p.id AND cpa.child_id = auth.uid()
            )
            AND EXISTS (
              SELECT 1
              FROM public.family_relationships fr
              JOIN public.pack_purchases pp ON pp.user_id = fr.parent_id AND pp.pack_id = p.id
              WHERE fr.child_id = auth.uid()
            )
          )
        )
    )
  );

-- 2) Update templates read policy to per-child assignments (non-free only)
-- Drop broad authenticated read policy
DROP POLICY IF EXISTS "templates_select_all_for_users" ON public.templates;

-- Authenticated users can read templates if free OR assigned directly to them via child_template_assignments
CREATE POLICY "templates_select_free_or_assigned_for_user"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (
    is_free = TRUE
    OR EXISTS (
      SELECT 1
      FROM public.child_template_assignments cta
      WHERE cta.child_id = auth.uid()
        AND cta.storage_ref = public.templates.image_path
    )
  );
