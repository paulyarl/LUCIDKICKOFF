-- Entitlement-based visibility pgTAP tests for templates and storage
\set QUIET 1
\set ON_ERROR_STOP on
\set VERBOSITY terse

-- Load pgTAP helper (expects test_helper.sql in same dir)
\i test_helper.sql

-- Plan
SELECT plan(16);

-- Setup test data
DO $$
BEGIN
  PERFORM create_test_users();

  -- Clean any leftovers
  DELETE FROM public.user_entitlements WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111', -- parent
    '22222222-2222-2222-2222-222222222222'  -- child
  );
  DELETE FROM public.templates WHERE title like 'pgTAP%';
END$$;

-- Create three templates: free, premium-generic, premium-specific('gold')
INSERT INTO public.templates (title, image_path, is_free, tags, required_entitlement)
VALUES
  ('pgTAP Free Template', '/templates/free.svg', true, ARRAY['free'], NULL),
  ('pgTAP Premium Generic', '/templates/premium-generic.svg', false, ARRAY['premium'], NULL),
  ('pgTAP Premium Gold', '/templates/premium-gold.svg', false, ARRAY['premium','gold'], 'gold')
ON CONFLICT DO NOTHING;

-- Helper: count visible templates for current role/user
CREATE OR REPLACE FUNCTION _count_visible_templates()
RETURNS int LANGUAGE sql AS $$
  SELECT COUNT(*)::int FROM public.templates;
$$;

-- 1) Anonymous: only free
SELECT lives_ok('SET LOCAL ROLE anon', 'role anon');
SELECT results_eq('SELECT _count_visible_templates()', ARRAY[1], 'anon sees only free');

-- 2) Authenticated without entitlements: only free
SELECT lives_ok($$SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true)$$, 'set child sub');
SELECT set_local('role', 'authenticated');
SELECT results_eq('SELECT _count_visible_templates()', ARRAY[1], 'auth w/o entitlements sees only free');

-- 3) Grant ANY entitlement to child, should see free + premium-generic
INSERT INTO public.user_entitlements (user_id, code)
VALUES ('22222222-2222-2222-2222-222222222222', 'silver')
ON CONFLICT DO NOTHING;
SELECT results_eq('SELECT _count_visible_templates()', ARRAY[2], 'auth with any entitlement sees premium-generic');

-- 4) Without specific entitlement, should NOT see gold-only
SELECT is_empty(
  $$SELECT 1 FROM public.templates WHERE title = 'pgTAP Premium Gold'$$,
  'no gold entitlement -> no gold template'
);

-- 5) Grant gold entitlement, now should see all three
INSERT INTO public.user_entitlements (user_id, code)
VALUES ('22222222-2222-2222-2222-222222222222', 'gold')
ON CONFLICT DO NOTHING;
SELECT results_eq('SELECT _count_visible_templates()', ARRAY[3], 'gold entitlement -> sees all three');

-- 6) Admin sees everything regardless
SELECT lives_ok($$SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true)$$, 'set parent sub');
-- Make parent an admin using helper if available; otherwise expect policies allow admin via is_admin()
-- Ensure parent has admin role claim
SELECT set_config('request.jwt.claim.role', 'admin', true);
SELECT results_eq('SELECT _count_visible_templates()', ARRAY[3], 'admin sees all');

-- Finish
SELECT * FROM finish();
ROLLBACK;
